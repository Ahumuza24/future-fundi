import { beforeEach, describe, expect, it, vi } from "vitest";

import api, { studentApi, teacherApi } from "./api";

describe("teacherApi.badges", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps dashboard badge awards to the teacher badge endpoint payload", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });

    await teacherApi.badges.awardBadge({
      learner_id: "learner-1",
      badge_name: "Sensor Specialist",
      module_id: "module-1",
    });

    expect(post).toHaveBeenCalledWith("/api/teacher/badges/award/", {
      learner: "learner-1",
      badge_name: "Sensor Specialist",
      module: "module-1",
    });
  });

  it("maps canonical dashboard badge awards to badge template evidence payloads", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });

    await teacherApi.badges.awardBadge({
      learner_id: "learner-1",
      badge_template_id: "badge-template-1",
      evidence_ids: ["evidence-1", "evidence-2"],
    });

    expect(post).toHaveBeenCalledWith("/api/teacher/badges/award/", {
      learner: "learner-1",
      learner_id: "learner-1",
      badge_template_id: "badge-template-1",
      evidence_ids: ["evidence-1", "evidence-2"],
    });
  });
});

describe("teacherApi.credentials", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps canonical microcredential awards to template evidence payloads", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });

    await teacherApi.credentials.award({
      learner_id: "learner-1",
      microcredential_template_id: "micro-template-1",
      evidence_ids: ["evidence-1"],
      badge_record_ids: ["badge-record-1"],
    });

    expect(post).toHaveBeenCalledWith("/api/teacher/credentials/award/", {
      learner: "learner-1",
      learner_id: "learner-1",
      microcredential_template_id: "micro-template-1",
      evidence_ids: ["evidence-1"],
      badge_record_ids: ["badge-record-1"],
    });
  });
});

describe("studentApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("includes task_id when uploading task-level evidence", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });

    await studentApi.uploadArtifact({
      title: "Line sensor evidence",
      module_id: "module-1",
      task_id: "task-1",
    });

    const formData = post.mock.calls[0][1] as FormData;
    expect(post.mock.calls[0][0]).toBe("/api/student/upload-artifact/");
    expect(formData.get("module_id")).toBe("module-1");
    expect(formData.get("task_id")).toBe("task-1");
  });
});

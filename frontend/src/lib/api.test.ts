import { beforeEach, describe, expect, it, vi } from "vitest";

import api, { teacherApi } from "./api";

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
});

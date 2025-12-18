class PrimaryReplicaRouter:
    """Route reads to replica and writes to default."""

    def db_for_read(self, model, **hints):
        return "read_replica"

    def db_for_write(self, model, **hints):
        return "default"


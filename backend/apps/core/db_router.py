class PrimaryReplicaRouter:
    """Route reads to replica and writes to default."""

    def db_for_read(self, model, **hints):
        return "read_replica"

    def db_for_write(self, model, **hints):
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        """
        Always allow relations so cross-db FK checks (e.g., token_blacklist -> users.User)
        don't raise errors when reads hit the replica.
        """
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Ensure all apps migrate on the default database. Replica mirrors data only.
        """
        return db == "default"


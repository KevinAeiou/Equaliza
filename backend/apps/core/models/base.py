from apps.core.models import TrackableMixin


class BaseModel(TrackableMixin):
    class Meta:
        abstract = True
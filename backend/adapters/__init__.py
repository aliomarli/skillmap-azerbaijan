from .base_adapter import BaseAdapter, StandardJobPost
from .jobsearch_adapter import JobsearchAdapter
from .boss_az_adapter import BossAzAdapter
from .hellojob_adapter import HelloJobAdapter
from .linkedin_adapter import LinkedInAdapter
from .dma_adapter import DMAAdapter
from .direct_adapter import DirectEmployerAdapter

ADAPTERS_REGISTRY = {
    "jobsearch": JobsearchAdapter,
    "boss_az": BossAzAdapter,
    "hellojob": HelloJobAdapter,
    "linkedin": LinkedInAdapter,
    "dma": DMAAdapter,
    "direct": DirectEmployerAdapter
}

def get_adapter(source_key: str) -> BaseAdapter:
    adapter_cls = ADAPTERS_REGISTRY.get(source_key.lower(), JobsearchAdapter)
    return adapter_cls()

__all__ = [
    "BaseAdapter",
    "StandardJobPost",
    "JobsearchAdapter",
    "BossAzAdapter",
    "HelloJobAdapter",
    "LinkedInAdapter",
    "DMAAdapter",
    "DirectEmployerAdapter",
    "get_adapter",
    "ADAPTERS_REGISTRY"
]

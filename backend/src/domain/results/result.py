from dataclasses import dataclass
from typing import Any, Optional, TypeVar, Generic

T = TypeVar("T")

@dataclass
class Result(Generic[T]):
    is_success: bool
    error: Optional[str] = None
    value: Optional[T] = None

    @staticmethod
    def ok(value: Optional[T] = None) -> "Result[T]":
        return Result(is_success=True, value=value)

    @staticmethod
    def fail(error: str) -> "Result[T]":
        return Result(is_success=False, error=error)

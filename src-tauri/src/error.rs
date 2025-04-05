use serde::Serialize;
use std::error::Error;

#[derive(Debug, Serialize)]
pub struct OllamateError(pub String);

pub type OllamateResult<T> = Result<T, OllamateError>;

impl<T> From<T> for OllamateError
where
  T: Error,
{
  fn from(err: T) -> Self {
    OllamateError(err.to_string())
  }
}

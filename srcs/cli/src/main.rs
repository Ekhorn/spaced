// use clap::Command;

use std::ops::{Deref, Not};

use clap::{Args, Parser};
#[cfg(feature = "completions")]
use clap_complete::Shell;

use service::ServiceOpt;

mod service;

#[derive(Parser, Debug)]
#[clap(version, about, author)]
pub struct Opt {
  #[clap(subcommand)]
  pub command: Command,
}

#[derive(Parser, Debug)]
pub enum Command {
  #[clap(alias = "service")]
  Service(ServiceOpt),
}

fn main() {
  match Opt::parse().command {
    Command::Service(service) => {

    }
  }
}

use clap::Parser;

#[derive(Parser, Debug)]
pub struct ServiceOpt {
  #[clap(subcommand)]
  pub command: ServiceCommand,
}

#[derive(Parser, Debug)]
pub enum ServiceCommand {
}

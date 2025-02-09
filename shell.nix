let
  pkgs = import <nixpkgs> { };
  unstable = import (fetchTarball "https://nixos.org/channels/nixos-unstable/nixexprs.tar.xz") { };
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    openssl
  ];
  nativeBuildInputs = with pkgs; [
    unstable.playwright.browsers
    pkg-config
    gobject-introspection
    cargo
    cargo-udeps
    cargo-tauri
    sqlx-cli
  ];

  shellHook =
    ''
      export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS
      export PLAYWRIGHT_BROWSERS_PATH=${unstable.playwright.browsers}
      export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
    '';
}

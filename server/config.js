// Server Configuration

export const config = {
  port: process.env.PORT || 3000,
  distPath: null, // Will be set in server initialization
};

export function setDistPath(path) {
  config.distPath = path;
}

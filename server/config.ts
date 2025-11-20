// Server Configuration

interface Config {
    port: number;
    distPath: string | null;
}

export const config: Config = {
    port: parseInt(process.env.PORT || "3000", 10),
    distPath: null,
};

export function setDistPath(path: string): void {
    config.distPath = path;
}

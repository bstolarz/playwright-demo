interface EnvConfig {
    baseUrl: string;
    apiUrl: string;
    extraHTTPHeaders: {[key: string]: string},
};

export class Environments {
    private static configs: Record<string, EnvConfig> = {
        DEV: {
            baseUrl: 'https://www.metrogas.com.ar/',
            apiUrl: 'https://api.metrogas.com.ar/',
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }

}
}


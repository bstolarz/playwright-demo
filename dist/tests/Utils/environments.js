"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environments = void 0;
;
class Environments {
    static configs = {
        DEV: {
            baseUrl: 'https://www.metrogas.com.ar/',
            apiUrl: 'https://api.metrogas.com.ar/',
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }
    };
}
exports.Environments = Environments;
//# sourceMappingURL=environments.js.map
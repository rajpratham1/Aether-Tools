class SecurityTester {
    constructor() {
        this.storageKeys = {
            advancedConfig: 'aetherScannerAdvancedConfig'
        };
        this.defaultTestState = {
            headers: true,
            ssl: true,
            api: true,
            cors: true,
            tech: true,
            firebase: true,
            mongodb: true,
            xss: true,
            sqli: true,
            directories: true,
            auth: true,
            datamod: true,
            cookies: true,
            subdomains: true
        };

        this.payloadLibrary = {
            xss: [
                '<script>alert("XSS")</script>',
                '"><script>alert("XSS")</script>',
                'javascript:alert("XSS")',
                '<img src=x onerror=alert("XSS")>',
                '"><svg/onload=alert(1)>'
            ],
            sqli: [
                "' OR '1'='1",
                "' UNION SELECT NULL--",
                "'; DROP TABLE users--",
                "' OR 1=1--",
                "admin' --",
                "1' OR '1'='1"
            ],
            nosql: [
                '?title[$ne]=null',
                '?status[$ne]=draft',
                '?id[$regex]=.*',
                '?author[$exists]=true',
                '?_id[$ne]=null',
                '?$where=this.title.length>0',
                '?username[$gt]='
            ],
            traversal: [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
                '../../../../etc/shadow',
                '../../../var/log/apache/access.log',
                '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
            ]
        };

        this.toolDefinitions = [
            {
                id: 'subdomain',
                title: 'Subdomain Scanner',
                description: 'Checks common public subdomains for the current target.',
                runner: () => this.testSubdomains()
            },
            {
                id: 'ssl',
                title: 'SSL Analyzer',
                description: 'Verifies HTTPS usage and reports browser-visible certificate limitations.',
                runner: () => this.testSSLConfiguration()
            },
            {
                id: 'headers',
                title: 'Header Analyzer',
                description: 'Reviews major browser-visible security headers.',
                runner: () => this.testSecurityHeaders()
            },
            {
                id: 'cookie',
                title: 'Cookie Analyzer',
                description: 'Evaluates cookie flags when the browser can read them.',
                runner: () => this.testCookieSecurity()
            },
            {
                id: 'whois',
                title: 'Domain Snapshot',
                description: 'Summarizes hostname, origin, and scan readiness information.',
                runner: () => this.runDomainSnapshotTool()
            },
            {
                id: 'ports',
                title: 'Port Surface',
                description: 'Performs browser-safe HTTPS probes for a few well-known ports.',
                runner: () => this.runPortSurfaceTool()
            },
            {
                id: 'bomber',
                title: 'Request Bomber',
                description: 'Stress tests an endpoint by rapidly sending configurable concurrent requests.',
                runner: () => this.runRequestBomberTool()
            },
            {
                id: 'clickjacking',
                title: 'Clickjacking Tester',
                description: 'Interactive visual tool to check if a website is vulnerable to framing attacks.',
                runner: () => this.runClickjackingTool()
            }
        ];

        this.resetState();
        this.initializeEventListeners();
        this.loadSavedConfig();
        this.renderToolCards();
        this.renderPayloadLibrary();
        this.updateAdvancedConfigStatus('Settings are temporary by default. Save them only on a device you control.');
    }

    resetState() {
        this.results = [];
        this.currentUrl = '';
        this.testCount = 0;
        this.passedCount = 0;
        this.warningCount = 0;
        this.failedCount = 0;
        this.networkRequests = [];
        this.discoveredEndpoints = new Set();
        this.jsFiles = [];
        this.apiEndpoints = [];
        this.structuredResults = [];
        this.lastSummary = null;
        this.lastScanAt = null;
        this.scanNotes = [];
    }

    initializeEventListeners() {
        const startButton = document.getElementById('startTest');
        const urlInput = document.getElementById('websiteUrl');
        const persistToggle = document.getElementById('persistAdvancedSettings');

        if (startButton) {
            startButton.addEventListener('click', () => this.startSecurityTest());
        }

        if (urlInput) {
            urlInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.startSecurityTest();
                }
            });
        }

        if (persistToggle) {
            persistToggle.addEventListener('change', () => {
                const message = persistToggle.checked
                    ? 'Remember mode is enabled. Use "Save Settings" to store the current advanced configuration in this browser.'
                    : 'Remember mode is off. New scans will use temporary settings unless you save them again.';
                this.updateAdvancedConfigStatus(message);
            });
        }
    }

    renderToolCards() {
        const toolsGrid = document.getElementById('toolsGrid');
        if (!toolsGrid) return;

        toolsGrid.innerHTML = '';

        this.toolDefinitions.forEach((tool) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'feature-card';
            card.style.cursor = 'pointer';
            card.style.textAlign = 'left';
            card.innerHTML = `
                <h3>${tool.title}</h3>
                <p>${tool.description}</p>
            `;
            card.addEventListener('click', async () => {
                await this.runStandaloneTool(tool.id);
            });
            toolsGrid.appendChild(card);
        });
    }

    renderPayloadLibrary() {
        const payloadContainer = document.getElementById('payloadSamples');
        if (!payloadContainer) return;

        const sections = [
            { label: 'Sample XSS Payloads', values: this.payloadLibrary.xss },
            { label: 'Sample SQL Injection', values: this.payloadLibrary.sqli },
            { label: 'Sample NoSQL Injection', values: this.payloadLibrary.nosql.map((value) => value.replace(/^\?/, '')) },
            { label: 'Sample Path Traversal', values: this.payloadLibrary.traversal }
        ];

        payloadContainer.innerHTML = sections.map((section) => {
            const items = section.values.map((value) => {
                const escaped = this.escapeHtml(value);
                const encoded = encodeURIComponent(value).replace(/'/g, "%27");
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.1); padding: 8px 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                        <code style="word-break: break-all; font-family: monospace; font-size: 0.9rem; flex: 1;">${escaped}</code>
                        <button type="button" style="background: rgba(255,255,255,0.2); border: none; color: inherit; padding: 4px 10px; border-radius: 4px; cursor: pointer; margin-left: 10px; font-size: 0.8rem; transition: background 0.2s;" 
                            onclick="navigator.clipboard.writeText(decodeURIComponent('${encoded}')).then(() => { const old = this.innerText; this.innerText = 'Copied!'; setTimeout(() => this.innerText = old, 2000); })"
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            Copy
                        </button>
                    </div>`;
            }).join('');
            return `<div style="margin-bottom: 20px;"><strong style="color: #4299e1; display: block; margin-bottom: 10px;">${section.label}:</strong>${items}</div>`;
        }).join('');
    }

    parseCustomHeaders(raw) {
        const headers = {};
        raw.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
                const key = line.substring(0, idx).trim();
                const value = line.substring(idx + 1).trim();
                if (key && value) headers[key] = value;
            }
        });
        return headers;
    }

    getScanConfig() {
        return {
            deepScan: this.isChecked('deepScan'),
            authToken: document.getElementById('authToken')?.value.trim() || '',
            proxyUrl: document.getElementById('proxyUrl')?.value.trim() || '',
            scanSpeed: document.getElementById('scanSpeed')?.value || 'normal',
            customEndpoints: this.parseCustomEndpoints(document.getElementById('customEndpoints')?.value || ''),
            customHeaders: this.parseCustomHeaders(document.getElementById('customHeaders')?.value || ''),
            tests: this.getSelectedTests()
        };
    }

    loadSavedConfig() {
        try {
            const raw = localStorage.getItem(this.storageKeys.advancedConfig);
            if (!raw) return;

            const saved = JSON.parse(raw);
            this.setFieldValue('customEndpoints', saved.customEndpoints || '');
            this.setFieldValue('customHeaders', saved.customHeaders || '');
            this.setFieldValue('authToken', saved.authToken || '');
            this.setFieldValue('proxyUrl', saved.proxyUrl || '');
            this.setFieldValue('scanSpeed', saved.scanSpeed || 'normal');
            this.setCheckboxValue('persistAdvancedSettings', Boolean(saved.persistAdvancedSettings));
            this.updateAdvancedConfigStatus('Saved advanced settings were loaded from this browser.');
        } catch (error) {
            this.updateAdvancedConfigStatus('Saved advanced settings could not be read. The scanner will use temporary settings.');
        }
    }

    saveAdvancedSettings() {
        const persist = this.isChecked('persistAdvancedSettings');
        if (!persist) {
            localStorage.removeItem(this.storageKeys.advancedConfig);
            this.updateAdvancedConfigStatus('Remember mode is off, so settings were kept temporary and nothing was stored.');
            return;
        }

        const payload = {
            customEndpoints: document.getElementById('customEndpoints')?.value || '',
            customHeaders: document.getElementById('customHeaders')?.value || '',
            authToken: document.getElementById('authToken')?.value || '',
            proxyUrl: document.getElementById('proxyUrl')?.value || '',
            scanSpeed: document.getElementById('scanSpeed')?.value || 'normal',
            persistAdvancedSettings: true
        };

        localStorage.setItem(this.storageKeys.advancedConfig, JSON.stringify(payload));
        this.updateAdvancedConfigStatus('Advanced settings were saved in local browser storage on this device.');
    }

    clearAdvancedSettings() {
        localStorage.removeItem(this.storageKeys.advancedConfig);
        this.setFieldValue('customEndpoints', '');
        this.setFieldValue('authToken', '');
        this.setFieldValue('proxyUrl', '');
        this.setFieldValue('scanSpeed', 'normal');
        this.setCheckboxValue('persistAdvancedSettings', false);
        this.updateAdvancedConfigStatus('Saved advanced settings were removed from this browser.');
    }

    updateAdvancedConfigStatus(message) {
        const node = document.getElementById('advancedConfigStatus');
        if (node) {
            node.textContent = message;
        }
    }

    setFieldValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.value = value;
    }

    setCheckboxValue(id, value) {
        const field = document.getElementById(id);
        if (field) field.checked = value;
    }

    parseCustomEndpoints(rawValue) {
        return rawValue
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean);
    }

    getDelayMs() {
        const speed = document.getElementById('scanSpeed')?.value || 'normal';
        const delays = {
            fast: 100,
            normal: 500,
            slow: 1000,
            stealth: 2000
        };

        return delays[speed] || 500;
    }

    async waitForThrottle() {
        await new Promise((resolve) => setTimeout(resolve, this.getDelayMs()));
    }

    async startSecurityTest(options = {}) {
        const url = (options.url || document.getElementById('websiteUrl')?.value || '').trim();
        if (!url) {
            alert('Please enter a website URL.');
            return null;
        }

        if (!this.isValidUrl(url)) {
            alert('Please enter a valid URL, for example https://example.com');
            return null;
        }

        this.resetResultsView();
        this.currentUrl = url;
        this.showLoading(true);

        const config = this.getScanConfig();
        const selectedTests = options.tests || config.tests;

        if (selectedTests.length === 0) {
            this.addResult('warning', 'Scan Configuration', 'No test modules are enabled.', 'Enable at least one test option before starting a scan.');
            this.showLoading(false);
            return null;
        }

        try {
            this.updateScanProgress(5, 'Preparing scan...');
            this.addScanNote('Browser-based scans depend on CORS and exposed headers. Some checks may be partial without a relay proxy.');

            this.updateScanProgress(10, 'Fetching target homepage...');
            const mainPage = await this.fetchAndAnalyzeMainPage();

            if (config.deepScan && mainPage) {
                this.updateScanProgress(30, 'Inspecting JavaScript assets...');
                await this.deepScanJavaScriptFiles();

                this.updateScanProgress(45, 'Reviewing discovered endpoints...');
                await this.testDiscoveredEndpoints();
            }

            let progress = 55;
            const progressPerTest = selectedTests.length ? 40 / selectedTests.length : 40;

            for (const test of selectedTests) {
                this.updateScanProgress(Math.round(progress), `Running ${test} checks...`);
                await this.runTest(test);
                progress += progressPerTest;
            }

            this.updateScanProgress(100, 'Scan complete.');
            this.showSummary();
            return this.buildExportableReport();
        } catch (error) {
            console.error(error);
            this.addResult('danger', 'Scan Error', 'The scan stopped unexpectedly.', error.message);
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    async fetchAndAnalyzeMainPage() {
        try {
            const response = await this.makeRequest(this.currentUrl, { purpose: 'main-page' });
            const html = await this.safeReadText(response);
            this.logNetworkRequest('GET', this.currentUrl, response.status, 'Main page loaded');

            this.collectScriptSources(html);
            this.collectEndpointsFromText(html);

            const customEndpoints = this.getScanConfig().customEndpoints;
            customEndpoints.forEach((endpoint) => {
                const absolute = this.normalizeUrl(endpoint);
                if (absolute) {
                    this.discoveredEndpoints.add(absolute);
                }
            });

            this.logNetworkRequest(
                'INFO',
                'Discovery',
                200,
                `Found ${this.jsFiles.length} JavaScript files and ${this.discoveredEndpoints.size} candidate endpoints`
            );

            return { response, html };
        } catch (error) {
            this.logNetworkRequest('GET', this.currentUrl, 0, `Failed to fetch main page: ${error.message}`);
            this.addResult('warning', 'Main Page Fetch', 'The homepage could not be fully fetched.', error.message);
            return null;
        }
    }

    collectScriptSources(html) {
        const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
        let match;

        while ((match = scriptRegex.exec(html)) !== null) {
            const scriptUrl = this.normalizeUrl(match[1]);
            if (scriptUrl && !this.jsFiles.includes(scriptUrl)) {
                this.jsFiles.push(scriptUrl);
            }
        }
    }

    collectEndpointsFromText(content) {
        const apiPatterns = [
            /fetch\s*\(\s*["'`]([^"'`]+)["'`]/gi,
            /axios\.(?:get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
            /\burl\s*:\s*["'`]([^"'`]+)["'`]/gi,
            /\bbaseURL\s*:\s*["'`]([^"'`]+)["'`]/gi,
            /["'`](\/api\/[^"'`]+)["'`]/gi,
            /["'`](https?:\/\/[^"'`]*\/api\/[^"'`]+)["'`]/gi
        ];

        apiPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const endpoint = this.normalizeUrl(match[1]);
                if (endpoint) {
                    this.discoveredEndpoints.add(endpoint);
                }
            }
        });
    }

    async deepScanJavaScriptFiles() {
        const jsFiles = this.jsFiles.slice(0, 10);
        if (jsFiles.length === 0) {
            this.addResult('warning', 'Deep Scan', 'No external JavaScript files were discovered.', 'The page may be server-rendered or the scripts are blocked by the browser.');
            return;
        }

        for (const jsUrl of jsFiles) {
            try {
                const response = await this.makeRequest(jsUrl, { purpose: 'javascript-asset' });
                this.logNetworkRequest('GET', jsUrl, response.status, 'Inspecting JavaScript asset');

                if (!response.ok) {
                    await this.waitForThrottle();
                    continue;
                }

                const jsContent = await this.safeReadText(response);
                this.collectEndpointsFromText(jsContent);
                await this.waitForThrottle();
            } catch (error) {
                this.logNetworkRequest('GET', jsUrl, 0, `JavaScript scan failed: ${error.message}`);
            }
        }

        this.renderDiscoveredEndpoints();
    }

    renderDiscoveredEndpoints() {
        const container = document.getElementById('discoveredEndpoints');
        const list = document.getElementById('endpointsList');
        if (!container || !list) return;

        const endpoints = Array.from(this.discoveredEndpoints).sort();
        if (endpoints.length === 0) {
            container.style.display = 'none';
            list.innerHTML = '';
            return;
        }

        list.innerHTML = endpoints.map((endpoint) => `<div class="endpoint-item">${this.escapeHtml(endpoint)}</div>`).join('');
        container.style.display = 'block';
    }

    async testDiscoveredEndpoints() {
        const endpoints = Array.from(this.discoveredEndpoints).slice(0, 20);
        if (endpoints.length === 0) {
            return;
        }

        const findings = [];
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint, { purpose: 'endpoint-check' });
                this.logNetworkRequest('GET', endpoint, response.status, response.ok ? 'Endpoint responded' : 'Endpoint returned an error status');

                if (response.status === 200) {
                    const body = await this.safeReadText(response);
                    const matches = this.inspectSensitivePatterns(body);
                    if (matches.length > 0) {
                        findings.push({ endpoint, matches });
                    }
                }

                await this.waitForThrottle();
            } catch (error) {
                this.logNetworkRequest('GET', endpoint, 0, `Endpoint probe failed: ${error.message}`);
            }
        }

        this.apiEndpoints = findings;

        if (findings.length > 0) {
            const details = findings
                .map((finding) => `${finding.endpoint}\n  - ${finding.matches.join(', ')}`)
                .join('\n\n');

            this.addResult(
                'warning',
                'Discovered Endpoint Review',
                `${findings.length} discovered endpoints returned potentially sensitive content.`,
                details,
                'sensitive_data_exposure'
            );
        }
    }

    inspectSensitivePatterns(body) {
        const patterns = [
            { pattern: /"_id"/i, name: 'MongoDB object identifiers' },
            { pattern: /"password"/i, name: 'password fields' },
            { pattern: /"token"/i, name: 'token-like fields' },
            { pattern: /"secret"/i, name: 'secret-like fields' },
            { pattern: /"apiKey"/i, name: 'API key-like fields' },
            { pattern: /"email"/i, name: 'email addresses' }
        ];

        return patterns.filter((item) => item.pattern.test(body)).map((item) => item.name);
    }

    getSelectedTests() {
        const testMap = [
            ['testHeaders', 'headers'],
            ['testSSL', 'ssl'],
            ['testAPI', 'api'],
            ['testCORS', 'cors'],
            ['testTech', 'tech'],
            ['testFirebase', 'firebase'],
            ['testMongoDB', 'mongodb'],
            ['testXSS', 'xss'],
            ['testSQLi', 'sqli'],
            ['testDirectories', 'directories'],
            ['testAuth', 'auth'],
            ['testDataMod', 'datamod'],
            ['testCookies', 'cookies'],
            ['testSubdomains', 'subdomains'],
            ['testGraphQL', 'graphql'],
            ['testOpenRedirect', 'openredirect']
        ];

        return testMap.filter(([id]) => this.isChecked(id)).map(([, value]) => value);
    }

    isChecked(id) {
        return Boolean(document.getElementById(id)?.checked);
    }

    calculateCVSS(vulnerabilityType) {
        const cvssScores = {
            sql_injection: { score: 9.8, severity: 'critical' },
            nosql_injection: { score: 9.0, severity: 'critical' },
            xss: { score: 7.5, severity: 'high' },
            auth_bypass: { score: 9.1, severity: 'critical' },
            data_modification: { score: 8.8, severity: 'high' },
            sensitive_data_exposure: { score: 7.5, severity: 'high' },
            directory_traversal: { score: 7.5, severity: 'high' },
            missing_headers: { score: 5.3, severity: 'medium' },
            cors_misconfiguration: { score: 6.5, severity: 'medium' },
            ssl_issues: { score: 7.4, severity: 'high' },
            firebase_exposure: { score: 6.5, severity: 'medium' },
            cookie_security: { score: 4.3, severity: 'low' }
        };

        return cvssScores[vulnerabilityType] || { score: 5.0, severity: 'medium' };
    }

    getCVSSBadge(cvss) {
        return `<span class="cvss-score cvss-${cvss.severity}">CVSS ${cvss.score}</span>`;
    }

    async runTest(testType) {
        this.updateCurrentTest(`Running ${testType} checks...`);

        switch (testType) {
            case 'headers':
                await this.testSecurityHeaders();
                break;
            case 'ssl':
                await this.testSSLConfiguration();
                break;
            case 'api':
                await this.testAPIEndpoints();
                break;
            case 'cors':
                await this.testCORSConfiguration();
                break;
            case 'tech':
                await this.detectTechnology();
                break;
            case 'firebase':
                await this.testFirebaseSecurity();
                break;
            case 'mongodb':
                await this.testMongoDBSecurity();
                break;
            case 'xss':
                await this.testXSSVulnerabilities();
                break;
            case 'sqli':
                await this.testSQLInjection();
                break;
            case 'directories':
                await this.testDirectoryTraversal();
                break;
            case 'auth':
                await this.testAuthenticationBypass();
                break;
            case 'datamod':
                await this.testDataModification();
                break;
            case 'cookies':
                await this.testCookieSecurity();
                break;
            case 'subdomains':
                await this.testSubdomains();
                break;
            case 'graphql':
                await this.testGraphQL();
                break;
            case 'openredirect':
                await this.testOpenRedirect();
                break;
            default:
                this.addResult('warning', 'Unknown Test', `No handler exists for "${testType}".`, '');
        }
    }

    async testSecurityHeaders() {
        try {
            const response = await this.makeRequest(this.currentUrl, { purpose: 'headers' });
            const securityHeaders = {
                'content-security-policy': 'Protects against injected scripts',
                'x-frame-options': 'Reduces clickjacking risk',
                'x-content-type-options': 'Prevents MIME sniffing',
                'strict-transport-security': 'Enforces HTTPS usage',
                'referrer-policy': 'Controls referrer leakage',
                'permissions-policy': 'Limits browser feature access'
            };

            const missing = [];
            const present = [];

            Object.entries(securityHeaders).forEach(([header, description]) => {
                const value = this.getHeader(response.headers, header);
                if (value) {
                    present.push(`${header}: ${value}`);
                } else {
                    missing.push(`${header}: ${description}`);
                }
            });

            if (present.length === 0 && missing.length > 0 && response.meta?.viaProxy) {
                this.addResult(
                    'warning',
                    'Security Headers',
                    'The proxy returned page content but not enough header detail for a full header audit.',
                    'Use a header-preserving relay proxy for full accuracy.'
                );
                return;
            }

            if (missing.length === 0) {
                this.addResult('success', 'Security Headers', 'All major browser-visible security headers were found.', present.join('\n'), null);
            } else if (missing.length <= 2) {
                this.addResult(
                    'warning',
                    'Security Headers',
                    `${missing.length} recommended security headers are missing.`,
                    `Missing:\n${missing.join('\n')}\n\nPresent:\n${present.join('\n') || 'None detected'}`,
                    'missing_headers'
                );
            } else {
                this.addResult(
                    'danger',
                    'Security Headers',
                    `${missing.length} important security headers are missing.`,
                    `Missing:\n${missing.join('\n')}\n\nPresent:\n${present.join('\n') || 'None detected'}`,
                    'missing_headers'
                );
            }
        } catch (error) {
            this.addResult('warning', 'Security Headers', 'Header analysis could not complete.', error.message);
        }
    }

    async testSSLConfiguration() {
        try {
            const urlObject = new URL(this.currentUrl);
            if (urlObject.protocol !== 'https:') {
                this.addResult('danger', 'SSL/TLS Configuration', 'The target is not using HTTPS.', 'Move the site to HTTPS and redirect plain HTTP traffic.', 'ssl_issues');
                return;
            }

            const response = await this.makeRequest(this.currentUrl, { purpose: 'ssl' });
            const hsts = this.getHeader(response.headers, 'strict-transport-security');
            const details = [
                'HTTPS is enabled.'
            ];

            if (hsts) {
                details.push(`HSTS: ${hsts}`);
            } else {
                details.push('HSTS header not detected.');
            }

            if (response.ok) {
                const resultType = hsts ? 'success' : 'warning';
                const description = hsts ? 'HTTPS is active and HSTS is visible.' : 'HTTPS is active, but HSTS was not visible to the browser.';
                this.addResult(resultType, 'SSL/TLS Configuration', description, details.join('\n'), hsts ? null : 'ssl_issues');
            } else {
                this.addResult('warning', 'SSL/TLS Configuration', `HTTPS responded with status ${response.status}.`, details.join('\n'), 'ssl_issues');
            }
        } catch (error) {
            this.addResult('warning', 'SSL/TLS Configuration', 'SSL/TLS verification could not complete.', error.message, 'ssl_issues');
        }
    }

    async testAPIEndpoints() {
        const commonEndpoints = [
            '/api',
            '/api/v1',
            '/api/users',
            '/api/auth',
            '/api/login',
            '/api/admin',
            '/api/config',
            '/graphql',
            '/rest',
            '/v1',
            '/v2',
            ...this.getScanConfig().customEndpoints
        ];

        const found = [];
        const protectedEndpoints = [];

        for (const endpoint of [...new Set(commonEndpoints)]) {
            const testUrl = this.normalizeUrl(endpoint);
            if (!testUrl) continue;

            try {
                const response = await this.makeRequest(testUrl, { purpose: 'api-endpoint' });
                this.logNetworkRequest('GET', testUrl, response.status, 'API endpoint probe');

                if (response.status === 200) {
                    found.push(`${testUrl} (200)`);
                } else if (response.status === 401 || response.status === 403) {
                    protectedEndpoints.push(`${testUrl} (${response.status})`);
                }

                await this.waitForThrottle();
            } catch (error) {
                this.logNetworkRequest('GET', testUrl, 0, `API probe failed: ${error.message}`);
            }
        }

        if (found.length === 0 && protectedEndpoints.length === 0) {
            this.addResult('success', 'API Endpoints', 'No common API routes were publicly reachable.', 'No obvious API routes responded from the browser.');
        } else if (found.length === 0) {
            this.addResult('success', 'API Endpoints', 'Reachable API routes appear to require authorization.', protectedEndpoints.join('\n'));
        } else {
            this.addResult(
                'warning',
                'API Endpoints',
                `${found.length} API routes responded without an auth challenge.`,
                `Reachable:\n${found.join('\n')}\n\nProtected:\n${protectedEndpoints.join('\n') || 'None observed'}`
            );
        }
    }

    async testCORSConfiguration() {
        try {
            const response = await this.makeRequest(this.currentUrl, {
                headers: { Origin: 'https://example-security-check.invalid' },
                purpose: 'cors'
            });
            const corsOrigin = this.getHeader(response.headers, 'access-control-allow-origin');
            const credentials = this.getHeader(response.headers, 'access-control-allow-credentials');

            if (!corsOrigin) {
                this.addResult('success', 'CORS Configuration', 'No permissive CORS header was visible.', 'From the browser perspective, cross-origin access appears restricted.');
                return;
            }

            if (corsOrigin === '*') {
                const detail = credentials === 'true'
                    ? 'Wildcard origin combined with credentials is especially risky.'
                    : 'Wildcard origin allows any site to request this resource.';
                this.addResult('danger', 'CORS Configuration', 'The target exposes a permissive CORS policy.', detail, 'cors_misconfiguration');
                return;
            }

            this.addResult('success', 'CORS Configuration', 'A specific CORS origin policy was detected.', `Access-Control-Allow-Origin: ${corsOrigin}`);
        } catch (error) {
            this.addResult('warning', 'CORS Configuration', 'CORS analysis could not complete.', error.message);
        }
    }

    async detectTechnology() {
        try {
            const response = await this.makeRequest(this.currentUrl, { purpose: 'technology' });
            const html = await this.safeReadText(response);
            const technologies = new Set();

            const serverHeader = this.getHeader(response.headers, 'server');
            const poweredBy = this.getHeader(response.headers, 'x-powered-by');

            if (serverHeader) technologies.add(`Server: ${serverHeader}`);
            if (poweredBy) technologies.add(`Powered by: ${poweredBy}`);
            if (/react/i.test(html)) technologies.add('React');
            if (/vue/i.test(html)) technologies.add('Vue');
            if (/angular/i.test(html)) technologies.add('Angular');
            if (/next/i.test(html)) technologies.add('Next.js');
            if (/nuxt/i.test(html)) technologies.add('Nuxt');
            if (/firebase/i.test(html)) technologies.add('Firebase');
            if (/mongodb/i.test(html)) technologies.add('MongoDB');
            if (/graphql/i.test(html)) technologies.add('GraphQL');
            if (/cloudflare/i.test(serverHeader || '') || this.getHeader(response.headers, 'cf-ray')) technologies.add('Cloudflare');
            if (this.getHeader(response.headers, 'x-amz-cf-id')) technologies.add('AWS CloudFront');

            const techList = Array.from(technologies);
            if (techList.length === 0) {
                this.addResult('warning', 'Technology Detection', 'No strong technology fingerprints were visible.', 'The target may hide framework details or the browser could not fetch enough source content.');
                return;
            }

            this.showTechnologyStack(techList);
            this.addResult('success', 'Technology Detection', `${techList.length} technology indicators were detected.`, techList.join('\n'));
        } catch (error) {
            this.addResult('warning', 'Technology Detection', 'Technology detection could not complete.', error.message);
        }
    }

    async testFirebaseSecurity() {
        try {
            const response = await this.makeRequest(this.currentUrl, { purpose: 'firebase' });
            const html = await this.safeReadText(response);

            const configMatches = [];
            const firebasePatterns = [
                /apiKey.*?["']([^"']+)["']/gi,
                /authDomain.*?["']([^"']+)["']/gi,
                /projectId.*?["']([^"']+)["']/gi,
                /storageBucket.*?["']([^"']+)["']/gi
            ];

            firebasePatterns.forEach((pattern) => {
                let match;
                while ((match = pattern.exec(html)) !== null) {
                    configMatches.push(match[0]);
                }
            });

            if (configMatches.length === 0) {
                this.addResult('success', 'Firebase Security', 'No Firebase configuration markers were found in the page source.', '');
                return;
            }

            const details = `Detected configuration markers:\n${configMatches.join('\n')}`;
            this.addResult('warning', 'Firebase Security', 'Firebase configuration markers were found in the frontend.', `${details}\n\nFrontend config is often expected, but database rules should still be reviewed.`);
            await this.testFirebaseDatabase(html);
        } catch (error) {
            this.addResult('warning', 'Firebase Security', 'Firebase checks could not complete.', error.message);
        }
    }

    async testFirebaseDatabase(html) {
        const projectMatch = html.match(/projectId.*?["']([^"']+)["']/i);
        if (!projectMatch) {
            return;
        }

        const projectId = projectMatch[1];
        const urls = [
            `https://${projectId}-default-rtdb.firebaseio.com/.json`,
            `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app/.json`
        ];

        for (const url of urls) {
            try {
                const response = await this.makeRequest(url, { purpose: 'firebase-db' });
                if (response.status === 200) {
                    this.addResult('danger', 'Firebase Database', 'A Firebase Realtime Database endpoint responded publicly.', url, 'firebase_exposure');
                    return;
                }
            } catch (error) {
                continue;
            }
        }
    }

    async testMongoDBSecurity() {
        const endpoints = [
            '/api/blogs',
            '/api/users',
            '/api/posts',
            '/api/data',
            '/api/items',
            '/api/auth',
            '/api/admin',
            ...Array.from(this.discoveredEndpoints)
        ];

        const uniqueEndpoints = [...new Set(endpoints)]
            .map((value) => this.normalizeUrl(value))
            .filter(Boolean);

        const exposed = [];
        const injectionFindings = [];

        for (const endpoint of uniqueEndpoints.slice(0, 20)) {
            try {
                const response = await this.makeRequest(endpoint, { purpose: 'mongodb' });
                if (response.status === 200) {
                    const body = await this.safeReadText(response);
                    if (/"_id"/i.test(body)) {
                        exposed.push(`${endpoint} exposes MongoDB-style object identifiers.`);
                    }
                }

                for (const payload of this.payloadLibrary.nosql) {
                    const probe = this.appendQuery(endpoint, payload.replace(/^\?/, ''));
                    const injected = await this.makeRequest(probe, { purpose: 'nosql-injection' });
                    if (injected.status === 200) {
                        const body = await this.safeReadText(injected);
                        if (/"_id"|__v|createdAt|updatedAt/i.test(body)) {
                            injectionFindings.push(`${probe} responded with structured data.`);
                            break;
                        }
                    }
                }

                await this.waitForThrottle();
            } catch (error) {
                continue;
            }
        }

        if (injectionFindings.length > 0) {
            this.addResult('danger', 'MongoDB/NoSQL Security', 'Potential NoSQL injection patterns were observed.', injectionFindings.join('\n'), 'nosql_injection');
        } else if (exposed.length > 0) {
            this.addResult('warning', 'MongoDB/NoSQL Security', 'MongoDB-style data exposure was observed.', exposed.join('\n'), 'sensitive_data_exposure');
        } else {
            this.addResult('success', 'MongoDB/NoSQL Security', 'No obvious MongoDB or NoSQL issues were observed.', 'Common endpoints did not return MongoDB-like structures.');
        }
    }

    async testXSSVulnerabilities() {
        const params = ['q', 'search', 'query', 'name', 'message', 'comment'];
        const findings = [];

        for (const param of params) {
            for (const payload of this.payloadLibrary.xss) {
                try {
                    const testUrl = this.appendQuery(this.currentUrl, `${encodeURIComponent(param)}=${encodeURIComponent(payload)}`);
                    const response = await this.makeRequest(testUrl, { purpose: 'xss' });
                    const html = await this.safeReadText(response);
                    if (html.includes(payload) && !html.includes('&lt;script&gt;')) {
                        findings.push(`${param} reflected payload content without visible encoding.`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        if (findings.length > 0) {
            this.addResult('danger', 'XSS Vulnerabilities', 'Reflected payload behavior suggests possible XSS exposure.', findings.join('\n'), 'xss');
        } else {
            this.addResult('success', 'XSS Vulnerabilities', 'No reflected XSS behavior was observed in the tested parameters.', 'Common query parameter reflections appeared encoded or absent.');
        }
    }

    async testSQLInjection() {
        const params = ['id', 'user', 'search', 'category', 'page'];
        const findings = [];

        for (const param of params) {
            for (const payload of this.payloadLibrary.sqli) {
                try {
                    const testUrl = this.appendQuery(this.currentUrl, `${encodeURIComponent(param)}=${encodeURIComponent(payload)}`);
                    const response = await this.makeRequest(testUrl, { purpose: 'sql-injection' });
                    const body = await this.safeReadText(response);

                    if (response.status >= 500 && /(sql|mysql|syntax error|postgres|sqlite)/i.test(body)) {
                        findings.push(`${param} triggered a server error with SQL-like details.`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        if (findings.length > 0) {
            this.addResult('danger', 'SQL Injection', 'Potential SQL injection indicators were observed.', findings.join('\n'), 'sql_injection');
        } else {
            this.addResult('success', 'SQL Injection', 'No SQL error disclosure was observed for the tested parameters.', 'This is a passive browser-level heuristic, not a guarantee.');
        }
    }

    async testDirectoryTraversal() {
        const params = ['file', 'path', 'include', 'page', 'document'];
        const findings = [];

        for (const param of params) {
            for (const payload of this.payloadLibrary.traversal) {
                try {
                    const testUrl = this.appendQuery(this.currentUrl, `${encodeURIComponent(param)}=${encodeURIComponent(payload)}`);
                    const response = await this.makeRequest(testUrl, { purpose: 'directory-traversal' });
                    const content = await this.safeReadText(response);

                    if (/root:|localhost|drivers\\etc\\hosts/i.test(content)) {
                        findings.push(`${param} responded with file-like content for payload ${payload}`);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        if (findings.length > 0) {
            this.addResult('danger', 'Directory Traversal', 'Potential path traversal behavior was observed.', findings.join('\n'), 'directory_traversal');
        } else {
            this.addResult('success', 'Directory Traversal', 'No path traversal response patterns were observed.', 'The tested query parameters did not expose file-like content.');
        }
    }

    async testAuthenticationBypass() {
        const endpoints = ['/api/admin', '/api/users', '/api/auth/verify', '/admin', '/dashboard', '/api/config'];
        const unprotected = [];
        const protectedEndpoints = [];

        for (const endpoint of endpoints) {
            const testUrl = this.normalizeUrl(endpoint);
            if (!testUrl) continue;

            try {
                const response = await this.makeRequest(testUrl, { purpose: 'auth-bypass' });
                const body = await this.safeReadText(response);

                if (response.status === 200 && body.length > 80) {
                    unprotected.push(`${testUrl} returned content without an auth challenge.`);
                } else if (response.status === 401 || response.status === 403) {
                    protectedEndpoints.push(`${testUrl} returned ${response.status}.`);
                }
            } catch (error) {
                continue;
            }
        }

        if (unprotected.length > 0) {
            this.addResult('danger', 'Authentication Bypass', 'Sensitive routes responded without an obvious auth challenge.', unprotected.join('\n'), 'auth_bypass');
        } else if (protectedEndpoints.length > 0) {
            this.addResult('success', 'Authentication Bypass', 'Sensitive routes that responded were protected.', protectedEndpoints.join('\n'));
        } else {
            this.addResult('success', 'Authentication Bypass', 'No common sensitive routes responded.', '');
        }
    }

    async testDataModification() {
        const endpoints = [
            '/api/blogs',
            '/api/users',
            '/api/posts',
            '/api/comments'
        ];

        const findings = [];
        const protectedEndpoints = [];

        for (const endpoint of endpoints) {
            const url = this.normalizeUrl(endpoint);
            if (!url) continue;

            try {
                const optionsResponse = await this.makeRequest(url, { method: 'OPTIONS', purpose: 'options' });
                const allowHeader = this.getHeader(optionsResponse.headers, 'allow');
                const aclMethods = this.getHeader(optionsResponse.headers, 'access-control-allow-methods');
                const combined = [allowHeader, aclMethods].filter(Boolean).join(', ');

                if (combined) {
                    if (/post|put|delete/i.test(combined)) {
                        findings.push(`${url} advertises write methods: ${combined}`);
                    } else {
                        protectedEndpoints.push(`${url} responded with methods: ${combined}`);
                    }
                }

                await this.waitForThrottle();
            } catch (error) {
                continue;
            }
        }

        if (findings.length > 0) {
            this.addResult(
                'warning',
                'Data Modification',
                'Write-capable methods were advertised on public routes.',
                `${findings.join('\n')}\n\nThis check is passive and does not perform destructive writes.`,
                'data_modification'
            );
        } else if (protectedEndpoints.length > 0) {
            this.addResult('success', 'Data Modification', 'No unsafe write capability was advertised by the tested routes.', protectedEndpoints.join('\n'));
        } else {
            this.addResult('success', 'Data Modification', 'No write-capable endpoints were identified by passive probing.', 'OPTIONS responses did not expose risky write methods.');
        }
    }

    async testCookieSecurity() {
        try {
            const response = await this.makeRequest(this.currentUrl, { purpose: 'cookies' });
            const cookieHeader = this.getHeader(response.headers, 'set-cookie');

            if (!cookieHeader) {
                this.addResult(
                    'warning',
                    'Cookie Security',
                    'Cookie attributes were not visible to the browser-based scanner.',
                    'Many browsers do not expose Set-Cookie headers to frontend JavaScript. Use a relay proxy for full cookie auditing.',
                    'cookie_security'
                );
                return;
            }

            const issues = [];
            if (!/httponly/i.test(cookieHeader)) issues.push('Missing HttpOnly');
            if (!/secure/i.test(cookieHeader)) issues.push('Missing Secure');
            if (!/samesite/i.test(cookieHeader)) issues.push('Missing SameSite');

            if (issues.length > 0) {
                this.addResult('warning', 'Cookie Security', `${issues.length} cookie hardening issues were found.`, issues.join('\n'), 'cookie_security');
            } else {
                this.addResult('success', 'Cookie Security', 'Visible cookies include key hardening attributes.', cookieHeader);
            }
        } catch (error) {
            this.addResult('warning', 'Cookie Security', 'Cookie analysis could not complete.', error.message, 'cookie_security');
        }
    }

    async testSubdomains() {
        const subdomains = ['www', 'api', 'admin', 'dev', 'staging', 'test', 'mail', 'app', 'docs', 'cdn'];
        const hostname = new URL(this.currentUrl).hostname.replace(/^www\./, '');
        const found = [];

        for (const subdomain of subdomains) {
            const candidate = `https://${subdomain}.${hostname}`;
            try {
                const response = await this.makeRequest(candidate, { purpose: 'subdomain' });
                if (response.ok || response.status === 401 || response.status === 403) {
                    found.push(`${candidate} (${response.status})`);
                    this.logNetworkRequest('GET', candidate, response.status, 'Subdomain probe');
                }
                await this.waitForThrottle();
            } catch (error) {
                continue;
            }
        }

        if (found.length > 0) {
            this.addResult('warning', 'Subdomain Discovery', `Found ${found.length} responsive common subdomains.`, found.join('\n'));
        } else {
            this.addResult('success', 'Subdomain Discovery', 'No responsive common subdomains were observed.', 'Only a limited browser-safe subdomain wordlist was tested.');
        }
    }

    async testGraphQL() {
        const endpoints = ['/graphql', '/api/graphql', '/v1/graphql', '/v2/graphql', '/gql'];
        const query = '{"query": "\\n    query IntrospectionQuery {\\n      __schema {\\n        queryType { name }\\n        mutationType { name }\\n        subscriptionType { name }\\n      }\\n    }\\n  "}';
        let found = false;

        for (const endpoint of endpoints) {
            const url = new URL(endpoint, this.currentUrl).href;
            try {
                const response = await this.makeRequest(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: query,
                    purpose: 'graphql-introspection'
                });
                
                if (response.ok) {
                    const text = await response.text();
                    if (text.includes('__schema') || text.includes('queryType')) {
                        this.addResult('danger', 'GraphQL Introspection', `GraphQL introspection is ENABLED at ${endpoint}`, 'This allows attackers to query the full API schema, uncovering hidden fields, mutations, and internal data structures.\n\nFix: Disable introspection in your GraphQL server configuration in production.');
                        found = true;
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found) {
            this.addResult('success', 'GraphQL Introspection', 'No open GraphQL introspection endpoints found.', 'Endpoints tested: ' + endpoints.join(', '));
        }
    }

    async testOpenRedirect() {
        const params = ['next', 'url', 'redirect', 'return', 'return_to', 'destination', 'goto'];
        const payload = 'https://example.com';
        let vulnerable = [];

        for (const param of params) {
            const testUrl = new URL(this.currentUrl);
            testUrl.searchParams.set(param, payload);
            
            try {
                // Using fetch with redirect: 'manual' is generally not supported in browsers to read Location,
                // but we can check if we end up at example.com if redirect is 'follow' or catch opaque responses.
                // A better browser-safe heuristic for Open Redirect is if the server returns a redirect status.
                // We'll just append it to the discovered endpoints to flag it.
                const response = await this.makeRequest(testUrl.href, { purpose: 'open-redirect' });
                if (response.url.startsWith('https://example.com')) {
                    vulnerable.push(`?${param}=${payload}`);
                }
            } catch (e) { }
        }

        if (vulnerable.length > 0) {
            this.addResult('danger', 'Open Redirect', `Potential open redirect found using parameters:`, vulnerable.join('\n') + '\n\nFix: Validate all redirect URLs against an allowlist of trusted domains before redirecting.');
        } else {
            this.addResult('success', 'Open Redirect', 'No obvious open redirect vulnerabilities detected.', 'Tested common redirect parameters.');
        }
    }

    async runStandaloneTool(toolId) {
        const url = (document.getElementById('websiteUrl')?.value || '').trim();
        if (!url || !this.isValidUrl(url)) {
            alert('Enter a valid website URL in the scanner tab first.');
            return;
        }

        this.currentUrl = url;
        this.updateToolStatus(`Running ${toolId} tool against ${url}...`);

        const tool = this.toolDefinitions.find((item) => item.id === toolId);
        if (!tool) {
            this.updateToolStatus(`No tool found for ${toolId}.`);
            return;
        }

        try {
            const output = await tool.runner();
            if (typeof output === 'string' && output) {
                this.updateToolStatus(output);
            } else {
                this.updateToolStatus(`${tool.title} completed. Review the scanner results for details.`);
            }
        } catch (error) {
            this.updateToolStatus(`${tool.title} failed: ${error.message}`);
        }
    }

    async runDomainSnapshotTool() {
        const url = new URL(this.currentUrl);
        const details = [
            `Origin: ${url.origin}`,
            `Hostname: ${url.hostname}`,
            `Protocol: ${url.protocol}`,
            `Path: ${url.pathname || '/'}`
        ];

        this.addResult('success', 'Domain Snapshot', 'Generated a browser-side domain summary.', details.join('\n'));
        return details.join('\n');
    }

    async runPortSurfaceTool() {
        const url = new URL(this.currentUrl);
        const candidatePorts = [443, 8443, 9443];
        const findings = [];

        for (const port of candidatePorts) {
            const candidate = `${url.protocol}//${url.hostname}:${port}/`;
            try {
                const response = await this.makeRequest(candidate, { purpose: 'port-surface' });
                if (response.ok || response.status === 401 || response.status === 403) {
                    findings.push(`${candidate} responded with ${response.status}`);
                }
            } catch (error) {
                continue;
            }
        }

        if (findings.length === 0) {
            this.addResult('success', 'Port Surface', 'No additional browser-reachable HTTPS ports responded.', 'Only limited browser-safe ports were tested.');
            return 'No browser-reachable alternate HTTPS ports responded.';
        }

        this.addResult('warning', 'Port Surface', 'Additional browser-reachable HTTPS ports responded.', findings.join('\n'));
        return findings.join('\n');
    }

    async runRequestBomberTool() {
        const target = this.currentUrl;
        if (!target) return 'No target URL selected.';
        
        let count = prompt("Enter number of requests to send (e.g. 100):", "50");
        if (count === null) return "Bomber cancelled.";
        count = parseInt(count, 10);
        
        let concurrency = prompt("Enter concurrent connections (e.g. 10):", "10");
        if (concurrency === null) return "Bomber cancelled.";
        concurrency = parseInt(concurrency, 10);
        
        if (isNaN(count) || count <= 0 || isNaN(concurrency) || concurrency <= 0) {
            alert('Invalid input. Must be positive numbers.');
            return 'Invalid parameters provided to Request Bomber.';
        }

        if (count > 1000) {
            if (!confirm(`Warning: You are about to send ${count} requests. This may cause browser instability or trigger anti-bot measures. Continue?`)) {
                return 'Bomber cancelled by user.';
            }
        }

        this.updateToolStatus(`Bomber started: sending ${count} requests to ${target} with concurrency ${concurrency}...`);
        
        let completed = 0;
        let successes = 0;
        let failures = 0;
        let i = 0;
        const limit = concurrency;
        
        const worker = async () => {
            while (i < count) {
                i++;
                try {
                    // Use no-cors to aggressively send requests without being blocked by CORS preflights
                    await fetch(target, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
                    successes++;
                } catch (e) {
                    failures++;
                }
                completed++;
                if (completed % 20 === 0 || completed === count) {
                    this.updateToolStatus(`Bomber progress: ${completed}/${count} (${failures} local network failures)`);
                }
            }
        };

        const workers = [];
        for (let w = 0; w < limit; w++) {
            workers.push(worker());
        }
        
        await Promise.all(workers);
        
        const msg = `Bomber finished! Total triggered: ${count}. (Note: Response status is intentionally opaque due to no-cors mode, but ${failures} local network failures occurred).`;
        this.addResult(failures > 0 ? 'warning' : 'success', 'Request Bomber', `Sent ${count} concurrent requests to ${target}`, msg);
        return msg;
    }

    async makeRequest(url, options = {}) {
        const normalizedUrl = this.normalizeUrl(url);
        if (!normalizedUrl) {
            throw new Error(`Invalid URL: ${url}`);
        }

        const headers = new Headers(options.headers || {});
        const config = this.getScanConfig();
        
        if (config.customHeaders) {
            Object.entries(config.customHeaders).forEach(([key, value]) => {
                if (!headers.has(key)) {
                    headers.set(key, value);
                }
            });
        }

        if (config.authToken && !headers.has('Authorization')) {
            headers.set('Authorization', config.authToken.startsWith('Bearer ') ? config.authToken : `Bearer ${config.authToken}`);
        }

        const requestInit = {
            method: options.method || 'GET',
            headers,
            redirect: 'follow'
        };

        if (options.body) {
            requestInit.body = options.body;
        }

        try {
            const response = await fetch(normalizedUrl, requestInit);
            response.meta = { viaProxy: false, source: 'direct' };
            return response;
        } catch (directError) {
            const proxyUrl = config.proxyUrl.trim();
            if (proxyUrl) {
                const proxied = await this.makeProxyRequest(proxyUrl, normalizedUrl, requestInit);
                proxied.meta = { viaProxy: true, source: 'custom-proxy' };
                return proxied;
            }

            const fallback = await this.makeAllOriginsRequest(normalizedUrl);
            fallback.meta = { viaProxy: true, source: 'allorigins' };
            return fallback;
        }
    }

    async makeProxyRequest(proxyBase, url, requestInit) {
        const proxyUrl = new URL(proxyBase);
        proxyUrl.searchParams.set('url', url);
        proxyUrl.searchParams.set('method', requestInit.method || 'GET');

        const response = await fetch(proxyUrl.toString(), {
            headers: requestInit.headers
        });

        if (!response.ok) {
            throw new Error(`Proxy request failed with ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : { contents: await response.text() };
        return this.createSyntheticResponse(url, payload, response.status, response.headers);
    }

    async makeAllOriginsRequest(url) {
        const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(fallbackUrl);
        if (!response.ok) {
            throw new Error(`Fallback proxy failed with ${response.status}`);
        }

        const body = await response.text();
        return this.createSyntheticResponse(url, { contents: body }, 200, new Headers());
    }

    createSyntheticResponse(url, payload, status = 200, headers = new Headers()) {
        const body = typeof payload.contents === 'string'
            ? payload.contents
            : typeof payload === 'string'
                ? payload
                : JSON.stringify(payload);

        const normalizedHeaders = headers instanceof Headers
            ? headers
            : new Headers(payload.headers || {});

        return {
            ok: status >= 200 && status < 300,
            redirected: false,
            status,
            statusText: payload.statusText || 'OK',
            url,
            headers: normalizedHeaders,
            text: async () => body,
            json: async () => {
                try {
                    return JSON.parse(body);
                } catch (error) {
                    return payload;
                }
            }
        };
    }

    getHeader(headers, name) {
        if (!headers) return '';
        if (typeof headers.get === 'function') {
            return headers.get(name) || headers.get(name.toLowerCase()) || '';
        }

        if (headers instanceof Map) {
            return headers.get(name) || headers.get(name.toLowerCase()) || '';
        }

        return headers[name] || headers[name.toLowerCase()] || '';
    }

    async safeReadText(response) {
        try {
            return await response.text();
        } catch (error) {
            return '';
        }
    }

    normalizeUrl(value) {
        if (!value) return '';
        try {
            if (value.startsWith('http://') || value.startsWith('https://')) {
                return new URL(value).href;
            }

            if (this.currentUrl) {
                return new URL(value, this.currentUrl).href;
            }

            return new URL(value).href;
        } catch (error) {
            return '';
        }
    }

    appendQuery(url, queryString) {
        const target = new URL(url);
        const params = new URLSearchParams(target.search);
        const incoming = new URLSearchParams(queryString);
        incoming.forEach((value, key) => {
            params.set(key, value);
        });
        target.search = params.toString();
        return target.toString();
    }

    isValidUrl(value) {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    addResult(type, title, description, details, vulnerabilityType = null) {
        this.testCount += 1;
        if (type === 'success') this.passedCount += 1;
        if (type === 'warning') this.warningCount += 1;
        if (type === 'danger') this.failedCount += 1;

        const cvss = vulnerabilityType ? this.calculateCVSS(vulnerabilityType) : null;
        const result = {
            type,
            title,
            description,
            details: details || '',
            vulnerabilityType,
            cvss
        };

        this.results.push(result);
        this.structuredResults.push(result);
        this.displayResult(result);
    }

    displayResult(result) {
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) return;

        const resultDiv = document.createElement('div');
        resultDiv.className = `test-result ${result.type}`;
        resultDiv.innerHTML = `
            <h3>
                <span class="status-icon ${result.type}"></span>
                ${this.escapeHtml(result.title)}
                ${result.cvss ? this.getCVSSBadge(result.cvss) : ''}
            </h3>
            <p><strong>${this.escapeHtml(result.description)}</strong></p>
            ${result.details ? `<div class="vulnerability-details"><pre>${this.escapeHtml(result.details)}</pre></div>` : ''}
            ${this.getFixSuggestion(result.title, result.type)}
        `;

        resultsSection.appendChild(resultDiv);
    }

    getFixSuggestion(title, type) {
        if (type === 'success') return '';

        const fixes = {
            'Security Headers': 'Add missing security headers at the server, CDN, or application layer.',
            'SSL/TLS Configuration': 'Enable HTTPS everywhere and add HSTS after certificate validation is stable.',
            'API Endpoints': 'Review which routes should be public and require auth or rate limits where needed.',
            'CORS Configuration': 'Allow only trusted origins and avoid wildcard access for sensitive resources.',
            'Firebase Security': 'Review Firebase rules and confirm public frontend config is backed by restricted data access.',
            'MongoDB/NoSQL Security': 'Validate and sanitize query parameters before building database queries.',
            'XSS Vulnerabilities': 'Encode reflected data and add a strict Content Security Policy.',
            'SQL Injection': 'Use parameterized queries and suppress verbose database errors.',
            'Directory Traversal': 'Restrict file access to an allowlist and normalize all file paths.',
            'Authentication Bypass': 'Protect sensitive endpoints with authentication and authorization checks.',
            'Data Modification': 'Require auth for write methods and confirm idempotent preflight handling.',
            'Cookie Security': 'Set HttpOnly, Secure, and SameSite on every sensitive cookie.',
            'Subdomain Discovery': 'Inventory public subdomains and retire or harden unused hosts.'
        };

        const fix = fixes[title];
        return fix ? `<div class="fix-suggestion"><strong>Fix Suggestion:</strong> ${this.escapeHtml(fix)}</div>` : '';
    }

    showTechnologyStack(technologies) {
        const techDetection = document.getElementById('techDetection');
        const techStack = document.getElementById('techStack');
        if (!techDetection || !techStack) return;

        techStack.innerHTML = '';
        technologies.forEach((item) => {
            const badge = document.createElement('span');
            badge.className = 'tech-badge';
            badge.textContent = item;
            techStack.appendChild(badge);
        });

        techDetection.style.display = 'block';
    }

    addScanNote(note) {
        if (!note) return;
        this.scanNotes.push(note);
        const container = document.getElementById('scanNotes');
        if (!container) return;

        container.innerHTML = this.scanNotes.map((item) => `<div class="endpoint-item">${this.escapeHtml(item)}</div>`).join('');
        container.parentElement.style.display = 'block';
    }

    showSummary() {
        const summarySection = document.getElementById('summarySection');
        if (!summarySection) return;

        document.getElementById('totalTests').textContent = String(this.testCount);
        document.getElementById('passedTests').textContent = String(this.passedCount);
        document.getElementById('warningTests').textContent = String(this.warningCount);
        document.getElementById('failedTests').textContent = String(this.failedCount);

        const securityScore = this.testCount === 0 ? 0 : Math.round((this.passedCount / this.testCount) * 100);
        document.getElementById('securityScore').textContent = `${securityScore}%`;
        summarySection.style.display = 'block';

        this.lastSummary = {
            url: this.currentUrl,
            timestamp: new Date().toISOString(),
            totalTests: this.testCount,
            passed: this.passedCount,
            warnings: this.warningCount,
            failed: this.failedCount,
            score: `${securityScore}%`
        };

        this.lastScanAt = this.lastSummary.timestamp;
    }

    buildExportableReport() {
        return {
            url: this.currentUrl,
            timestamp: this.lastScanAt || new Date().toISOString(),
            summary: this.lastSummary || {
                url: this.currentUrl,
                timestamp: new Date().toISOString(),
                totalTests: this.testCount,
                passed: this.passedCount,
                warnings: this.warningCount,
                failed: this.failedCount,
                score: this.testCount === 0 ? '0%' : `${Math.round((this.passedCount / this.testCount) * 100)}%`
            },
            results: this.structuredResults,
            networkRequests: this.networkRequests,
            discoveredEndpoints: Array.from(this.discoveredEndpoints),
            technologies: Array.from(document.querySelectorAll('#techStack .tech-badge')).map((node) => node.textContent),
            notes: [...this.scanNotes]
        };
    }

    showLoading(show) {
        const loading = document.getElementById('loadingSection');
        const button = document.getElementById('startTest');
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (button) button.disabled = show;
    }

    updateCurrentTest(message) {
        const node = document.getElementById('currentTest');
        if (node) node.textContent = message;
    }

    updateScanProgress(percent, status) {
        const progressBar = document.getElementById('scanProgress');
        const statusNode = document.getElementById('scanStatus');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.textContent = `${percent}%`;
        }
        if (statusNode) {
            statusNode.textContent = status;
        }
    }

    logNetworkRequest(method, url, status, details = '') {
        const entry = {
            method,
            url,
            status,
            details,
            timestamp: new Date().toISOString()
        };

        this.networkRequests.push(entry);

        const monitor = document.getElementById('networkMonitor');
        const list = document.getElementById('networkRequests');
        if (!monitor || !list) return;

        monitor.style.display = 'block';
        const item = document.createElement('div');
        item.className = `network-request ${status >= 400 ? 'error' : status >= 300 ? 'warning' : ''}`;
        item.innerHTML = `
            <div class="request-header">
                <span class="request-method">${this.escapeHtml(method)}</span>
                <span class="request-status ${status >= 400 ? 'error' : ''}">${this.escapeHtml(String(status))}</span>
            </div>
            <div>${this.escapeHtml(url)}</div>
            ${details ? `<div class="request-details">${this.escapeHtml(details)}</div>` : ''}
        `;
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;
    }

    resetResultsView() {
        this.resetState();

        const resultsSection = document.getElementById('resultsSection');
        const summarySection = document.getElementById('summarySection');
        const techDetection = document.getElementById('techDetection');
        const networkRequests = document.getElementById('networkRequests');
        const networkMonitor = document.getElementById('networkMonitor');
        const discoveredEndpoints = document.getElementById('discoveredEndpoints');
        const endpointsList = document.getElementById('endpointsList');
        const notesSection = document.getElementById('scanNotesSection');
        const notesList = document.getElementById('scanNotes');

        if (resultsSection) resultsSection.innerHTML = '';
        if (summarySection) summarySection.style.display = 'none';
        if (techDetection) techDetection.style.display = 'none';
        if (networkRequests) networkRequests.innerHTML = '';
        if (networkMonitor) networkMonitor.style.display = 'none';
        if (discoveredEndpoints) discoveredEndpoints.style.display = 'none';
        if (endpointsList) endpointsList.innerHTML = '';
        if (notesSection) notesSection.style.display = 'none';
        if (notesList) notesList.innerHTML = '';
        this.updateScanProgress(0, 'Ready to scan.');
        this.updateCurrentTest('Initializing...');
    }

    updateToolStatus(message) {
        const output = document.getElementById('toolOutput');
        if (output) {
            output.textContent = message;
        }
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.securityTester = new SecurityTester();
    window.saveAdvancedSettings = () => window.securityTester?.saveAdvancedSettings();
    window.clearAdvancedSettings = () => window.securityTester?.clearAdvancedSettings();
});

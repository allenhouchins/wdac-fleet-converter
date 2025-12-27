// WDAC to Fleet MDM
// Converts WDAC policy XML to Fleet-compatible SyncML format

class WDACConverter {
    constructor() {
        this.xmlContent = '';
        this.convertedContent = '';
        this.inputTimeout = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const pasteBtn = document.getElementById('pasteBtn');
        const xmlInput = document.getElementById('xmlInput');
        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const copyBtn = document.getElementById('copyBtn');
        const clearBtn = document.getElementById('clearBtn');

        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        pasteBtn.addEventListener('click', () => this.showPasteDialog());
        xmlInput.addEventListener('input', () => this.handleInputChange());
        convertBtn.addEventListener('click', () => this.convert());
        downloadBtn.addEventListener('click', () => this.downloadFile());
        copyBtn.addEventListener('click', () => this.copyToClipboard());
        clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.xmlContent = e.target.result;
            document.getElementById('xmlInput').value = this.xmlContent;
            this.updateConvertButtonState();
        };
        reader.readAsText(file);
    }

    showPasteDialog() {
        const xmlInput = document.getElementById('xmlInput');
        xmlInput.focus();
        xmlInput.select();
    }

    handleInputChange() {
        this.xmlContent = document.getElementById('xmlInput').value;
        this.updateConvertButtonState();
        
        // Debounce detection to avoid running on every keystroke
        clearTimeout(this.inputTimeout);
        this.inputTimeout = setTimeout(() => {
            // Could add policy GUID detection here if needed
        }, 300);
    }

    updateConvertButtonState() {
        const convertBtn = document.getElementById('convertBtn');
        convertBtn.disabled = !this.xmlContent.trim();
    }

    convert() {
        try {
            this.hideError();
            
            if (!this.xmlContent.trim()) {
                throw new Error('Please provide WDAC policy XML content');
            }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.xmlContent, 'text/xml');

            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid XML format. Please check your XML file.');
            }

            // Extract SiPolicy (WDAC policy root element)
            const siPolicy = xmlDoc.querySelector('SiPolicy');
            if (!siPolicy) {
                throw new Error('SiPolicy element not found. Please ensure this is a valid WDAC policy XML.');
            }

            // Get Policy GUID
            let policyGuid = document.getElementById('policyGuid').value.trim();
            if (!policyGuid) {
                // Try to extract from policy if it exists
                const policyId = siPolicy.getAttribute('PolicyID');
                if (policyId) {
                    policyGuid = policyId;
                    document.getElementById('policyGuid').value = policyGuid;
                } else {
                    throw new Error('Policy GUID is required. Please enter a GUID or ensure your policy XML contains a PolicyID attribute.');
                }
            }

            // Validate GUID format (basic check)
            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!guidRegex.test(policyGuid)) {
                throw new Error('Invalid GUID format. Please use a valid GUID (e.g., from PowerShell: [guid]::NewGuid())');
            }

            // Get policy name (optional)
            const policyName = document.getElementById('policyName').value.trim() || 'WDACPolicy';

            // Create SyncML item
            const syncMLItem = this.createSyncMLItem(siPolicy, policyGuid, policyName);

            // Build complete SyncML document
            this.convertedContent = this.buildSyncMLDocument(syncMLItem);

            // Display output
            this.displayOutput(this.convertedContent);
            document.getElementById('downloadBtn').disabled = false;

        } catch (error) {
            this.showError(error.message);
        }
    }

    createSyncMLItem(siPolicy, policyGuid, policyName) {
        // WDAC CSP path: ./Vendor/MSFT/ApplicationControl/Policies/{PolicyGUID}/Policy
        const locURI = `./Vendor/MSFT/ApplicationControl/Policies/${policyGuid}/Policy`;

        // Clone the SiPolicy and serialize it
        const siPolicyClone = siPolicy.cloneNode(true);
        const serializer = new XMLSerializer();
        const policyXML = serializer.serializeToString(siPolicyClone);

        // Create SyncML Item
        return {
            locURI,
            policyXML,
            policyGuid,
            policyName
        };
    }

    buildSyncMLDocument(item) {
        return `<Replace>
  <Item>
    <Target>
      <LocURI>${item.locURI}</LocURI>
    </Target>
    <Meta>
      <Format xmlns="syncml:metinf">chr</Format>
    </Meta>
    <Data><![CDATA[${item.policyXML}]]></Data>
  </Item>
</Replace>`;
    }

    displayOutput(content) {
        const outputSection = document.getElementById('outputSection');
        const outputCode = document.getElementById('output').querySelector('code');
        
        outputCode.textContent = content;
        outputSection.style.display = 'block';
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    downloadFile() {
        if (!this.convertedContent) {
            this.showError('No content to download. Please convert first.');
            return;
        }

        const blob = new Blob([this.convertedContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wdac-fleet-policy.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copyToClipboard() {
        if (!this.convertedContent) {
            this.showError('No content to copy. Please convert first.');
            return;
        }

        navigator.clipboard.writeText(this.convertedContent).then(() => {
            const copyBtn = document.getElementById('copyBtn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            this.showError('Failed to copy to clipboard: ' + err.message);
        });
    }

    clearAll() {
        this.xmlContent = '';
        this.convertedContent = '';
        document.getElementById('xmlInput').value = '';
        document.getElementById('fileInput').value = '';
        document.getElementById('policyGuid').value = '';
        document.getElementById('policyName').value = '';
        document.getElementById('outputSection').style.display = 'none';
        document.getElementById('downloadBtn').disabled = true;
        this.hideError();
        this.updateConvertButtonState();
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorSection.style.display = 'block';
        errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }
}

// Initialize converter when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WDACConverter();
});


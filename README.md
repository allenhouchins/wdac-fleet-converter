# WDAC to Fleet Converter

A web-based tool that converts Windows Defender Application Control (WDAC) policy XML files into Fleet-compatible MDM (Mobile Device Management) format for easy deployment.

## 🎯 Purpose

This tool helps Windows administrators create WDAC policies that can be deployed via Fleet. It automates the conversion process, ensuring your policies are in the correct format for the ApplicationControl Configuration Service Provider (CSP).

## 📋 Prerequisites

- A Windows machine with PowerShell (for creating WDAC policies)
- Access to create and export WDAC policies
- A web browser (no installation required)

## 🚀 Quick Start

### Step 1: Create Your WDAC Policy

1. **Using PowerShell**:
   ```powershell
   # Install ConfigCI module if needed
   Install-Module -Name ConfigCI -Force
   
   # Create a new policy (example)
   New-CIPolicy -FilePath ".\policy.xml" -Level FilePublisher -Fallback Hash -UserPEs
   ```

2. **Using WDAC Wizard**:
   - Download the WDAC Wizard from Microsoft
   - Use the wizard to create your policy
   - Export the policy as XML

3. **Export existing policy**:
   ```powershell
   # Export an existing policy
   Export-CIPolicy -FilePath ".\policy.xml" -PolicyId "{PolicyGUID}"
   ```

### Step 2: Convert Using This Tool

1. **Open the converter**:
   - Open `index.html` in your web browser
   - No server required - works offline!

2. **Upload or paste your XML**:
   - Click "Upload XML File" and select your WDAC policy XML
   - Or click "Paste XML" and paste the contents directly

3. **Configure policy settings**:
   - Enter a Policy GUID (required) - generate with PowerShell: `[guid]::NewGuid()`
   - Optionally enter a policy name

4. **Convert**:
   - Click "Convert to Fleet Format"
   - Review the output in the preview section

5. **Download**:
   - Click "Download SyncML File" to save the Fleet-compatible file
   - Or use "Copy to Clipboard" to copy the content

### Step 3: Deploy via Fleet

1. **Upload to Fleet**:
   - Log into your Fleet console
   - Navigate to the policy configuration section
   - Upload or paste the converted SyncML file

2. **Deploy to devices**:
   - Assign the policy to your target devices or groups
   - The policy will be applied via the ApplicationControl CSP

### Step 4: Verify Policy Deployment

After deploying the policy, you can verify it's been applied in several ways:

#### In Fleet Console

1. **Check Policy Status**:
   - Navigate to the device or policy management section in Fleet
   - View the policy assignment status for your target devices
   - Look for successful deployment confirmations

2. **Device Compliance**:
   - Check device compliance status to ensure policies are being applied
   - Review any error messages or deployment failures

#### On the Windows Device

1. **PowerShell Verification**:
   ```powershell
   # Check applied WDAC policies
   Get-CIPolicy
   
   # View policy details
   Get-CIPolicy -FilePath "C:\Windows\System32\CodeIntegrity\CiPolicies\Active\{PolicyGUID}.cip"
   ```

2. **Event Viewer** (Code Integrity Logs):
   - Open **Event Viewer** (`eventvwr.msc`)
   - Navigate to **Applications and Services Logs → Microsoft → Windows → Code Integrity → Operational**
   - Check for policy deployment events and block events

3. **Test the Policy** (Most Reliable Method):
   - Try running an application that should be blocked by your policy
   - If the policy is working, you should see a block message
   - **This is the most reliable way to verify the policy is active** - if apps are being blocked as expected, the policy is working correctly

**Note**: Policy deployment may take a few minutes. If the policy doesn't appear immediately, wait a few minutes and refresh, or check Fleet logs for deployment status.

## 📖 Understanding the Conversion

### What Gets Converted?

The tool takes your WDAC policy XML (SiPolicy element) and converts it into SyncML format that Fleet can deploy. The policy is deployed to the ApplicationControl CSP.

### Key Changes Made:

1. **Creates SyncML format**: Wraps the SiPolicy XML in the proper SyncML structure for MDM deployment
2. **Sets correct path**: Maps to the ApplicationControl CSP path:
   - `./Vendor/MSFT/ApplicationControl/Policies/{PolicyGUID}/Policy`

### Policy GUID

The Policy GUID is a unique identifier for your policy. This is required for WDAC policies deployed via MDM. You can generate a GUID using:

**PowerShell:**
```powershell
[guid]::NewGuid()
```

**Or use an online GUID generator**

## ⚠️ Important Notes

1. **System-Wide Enforcement**: WDAC policies are system-wide (unlike AppLocker which is user-based). They affect all users on the device.

2. **Testing**: Always test WDAC policies on a small group of devices before deploying organization-wide. WDAC is more restrictive than AppLocker.

3. **Reboot Required**: WDAC policy changes typically require a device reboot to take effect.

4. **Policy Conflicts**: Ensure no conflicting WDAC policies are already applied to target devices.

5. **Policy Signing**: For production deployments, consider signing your WDAC policies for better security and tamper protection.

6. **Policy Updates**: When updating policies, ensure the Policy GUID matches or properly handle policy replacement in your MDM system.

## 🔧 Troubleshooting

### Error: "SiPolicy element not found"
- Ensure you exported the policy from WDAC tools, not created it manually
- Verify the XML file is a valid WDAC policy export

### Error: "Policy GUID is required"
- Enter a valid GUID in the Policy GUID field
- Generate one using PowerShell: `[guid]::NewGuid()`
- Or check if your policy XML contains a PolicyID attribute

### Deployment Error
- Ensure you're using the converted file, not the original WDAC export
- Verify the Policy GUID is in the correct format
- Check Fleet logs for deployment errors

### Policy Not Applying
- Check that devices are properly enrolled in Fleet
- Verify the policy is assigned to the correct device groups
- Review Fleet logs for deployment errors
- Ensure Windows version supports ApplicationControl CSP (Windows 10 version 1709 or later)
- **Reboot the device** - WDAC policies typically require a reboot

## 📚 Additional Resources

- [Microsoft WDAC Documentation](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/windows-defender-application-control)
- [ApplicationControl CSP Documentation](https://learn.microsoft.com/en-us/windows/client-management/mdm/applicationcontrol-csp)
- [WDAC Policy Creation Guide](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/create-wdac-policy)
- [Fleet Documentation](https://fleetdm.com/docs)

## 🛠️ Technical Details

### File Structure
```
wdac-fleet-converter/
├── index.html      # Main web interface
├── app.js          # Conversion logic
├── styles.css     # Styling
└── README.md       # This file
```

### How It Works

1. **XML Parsing**: Uses the browser's built-in `DOMParser` to parse the WDAC policy XML
2. **Policy Extraction**: Extracts the `SiPolicy` element from the XML
3. **SyncML Generation**: Creates SyncML `Replace` operations for the policy
4. **Format Conversion**: Wraps SiPolicy XML in CDATA sections within SyncML Items

### Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## 📝 Example Use Cases

1. **Application Whitelisting**: Allow only approved applications to run
2. **Blocking Unwanted Software**: Create deny rules for unwanted applications
3. **Kernel-Mode Protection**: Control which drivers can load (WDAC supports kernel-mode, unlike AppLocker)
4. **Reputation-Based Control**: Use Intelligent Security Graph integration for dynamic policy decisions

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue or submit a pull request!

## 📄 License

This tool is provided as-is for use with Fleet and WDAC policy management.

---

**Made for Windows admins deploying WDAC policies via Fleet**


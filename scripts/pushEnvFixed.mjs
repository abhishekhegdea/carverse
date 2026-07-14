import { spawnSync } from "child_process";
import fs from "fs";

// The raw base64 key
const b64 = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCia4b+WBwJyxHt1KMen4u7bc9dnmZ3opYjEqv/te/0MqGStr5pq0872V2Kn+rURmb0SAb8vZ3sJ43X6H6fkoYmdZbLsKYQQxwxICEx6wMNNst8amcdFyRCAMvoWwx08oxnXsybK4fPTgBRqEaDUzWQ3qF9tEuC3On+l6AIQQIoO32GWnUART+5SjHChT8ENC/TbZUOmOnJzKAwVtIy+HR2Nx98IC8hryKvICjnKRn4M7UsMTRPSKwmiyN3EFKbMy3Yni0GGGs0Sr+HwjjgvoGpVTaOOwQ0h88jkN9P8hzhu5QzZRnMCLeqGjma/j9lG1fkC74nZrzjnqnSZrfNwRyhAgMBAAECggEAB/sDlN9sb+4VRpvXm1YYjhA9C6sQUC7iH1K4C9D7O4L6CGpH8eDpJuuCb/Yf75KOqtBtM3b3rwEEibLSofGXpi/J8Ik7Uk+R2jdrb3dOMj8v1sBS/7gW39Kyh4tjEc38fcnH1j9Yes7+L1pMLgC6gDtIMRPY+qhIgRTJ2A37AVH9hewefsh6NQ3UljTDpPZPBTakZ/UkdmNUcbyzJJnBRq5PX8unZMjvFMEaJ5vHMjrfZfeYkHMvy1yvNP4XIn5vjs5r8LJsJ/m8uwrkwK3xclKYNNhHV5MHyPL72bjVrmOm3fFmQO9G84iKRyHRs+ZZc/9JMt8BAjlC5gd2MP1sZwKBgQDhWDbFQao7+PR5nMrIwBh3r0Q3rH49w6vfk8aDYSDA21vYbuKd+0c8qBozWylm/vn4qzjjUnDM1O3357St2BuzeNXnsGkWQzn8S87qYLz6r59IoJ4JatSKyZHIt/rjvi0n2vpQA+KAtXTnCpqWm5AbIVRghATAo9qtu+gJ9dE8lwKBgQC4g+u2Z1uJFPVhwWz9JQPAcnfp3P4VzuSEy+g65QKMT53+IScbUvqO70Bzfwu7c+nbLTffkMH21VhwEvVKsj7dnAEh/OwDs6k2SWcB2Ax881+8qCik/mDkBuKoI9DzvrY+vsOgPlk8T3X4KPQRsf6rF0VcpS6PHl4maUcUGKc/hwKBgCV6moFsTnfzDBY98aw55tfhGqN32PdE2A0zcszfFqd81GXG64IDDPIVs2XfP5+VwNWPBMMqLwCiWYHl07MmQlUzP8BtIs1FGRvRL/Tjagr3srJNpHtEfV0n8UtE7kF6m+AJF6C/RKjLhUn4BYYPEYSxomr7Ch9QIUrL+efOLqK5AoGBAInF/zAAtwmBe8PVcPMIO2fsUPtvhs1z4ZACzVGEhEWOgXMrAA9YAzzNCrvypij+4SRF/E1TwnDzVojAryVqOKSyguoE95nAAd5GKsLmtlRqSRcOHOMuCdzaA033CGOoCF6LhHjXdTwiPPziX3QDCxxnUORfdodo7nYR7//idKdrAoGBANlRVQdpR3bzBMEV369GvS8SYJEqwjDnEL2ndZ9jRyZ2SZolGTokH3bSqh7kJpHMbVVGj7LSvHneIFmN78yQK7xDc8nSb/cqE/eLNfMyCHqU7a6ytKzHhwuxximJSUrw+rsPcOUvaRpwjGu5uvSkqKCWtBl7iFtQKsgoQLeU2L2y";

let formattedKey = "-----BEGIN PRIVATE KEY-----\n";
for (let i = 0; i < b64.length; i += 64) {
  formattedKey += b64.substring(i, i + 64) + "\n";
}
formattedKey += "-----END PRIVATE KEY-----\n";

fs.writeFileSync(".tmp-key.txt", formattedKey, "utf-8");
const result = spawnSync("npx", ["convex", "env", "set", "JWT_PRIVATE_KEY", "@.tmp-key.txt"], { shell: true, stdio: "inherit" });
if (result.status !== 0) {
  console.error("Failed to push");
} else {
  console.log("Properly formatted PKCS8 key injected.");
}
fs.unlinkSync(".tmp-key.txt");

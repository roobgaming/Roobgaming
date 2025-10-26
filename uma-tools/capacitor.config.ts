import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.roobgaming.umatools",
  appName: "Uma Tools",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
    // Para live reload en dispositivo:
    // url: "http://TU_IP_LOCAL:5173",
    // cleartext: true
  }
};

export default config;
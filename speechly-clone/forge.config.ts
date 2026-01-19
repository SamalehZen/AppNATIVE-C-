import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: '**/node_modules/{better-sqlite3,bindings,file-uri-to-path}/**/*',
    },
    appBundleId: 'com.speechly.clone',
    appCategoryType: 'public.app-category.productivity',
    name: 'Speechly Clone',
    executableName: 'speechly-clone',
    extraResource: ['./resources/icons'],
    icon: './resources/icons/icon',
    osxSign: process.env.APPLE_ID ? {} : undefined,
    osxNotarize: process.env.APPLE_ID ? {
      appleId: process.env.APPLE_ID!,
      appleIdPassword: process.env.APPLE_PASSWORD!,
      teamId: process.env.APPLE_TEAM_ID!,
    } : undefined,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'speechly-clone',
      setupIcon: './resources/icons/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/SamalehZen/AppNATIVE-C-/main/speechly-clone/resources/icons/icon.ico',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      icon: './resources/icons/icon.icns',
      format: 'ULFO',
    }),
    new MakerRpm({
      options: {
        icon: './resources/icons/icon.png',
        categories: ['Utility', 'Audio'],
      },
    }),
    new MakerDeb({
      options: {
        icon: './resources/icons/icon.png',
        categories: ['Utility', 'Audio'],
        maintainer: 'Speechly Clone',
        homepage: 'https://github.com/SamalehZen/AppNATIVE-C-',
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;

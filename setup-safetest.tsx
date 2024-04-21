import { setup } from "safetest/setup";
import "./test/unit/setup-test-env";

setup({
  bootstrappedAt: require.resolve("./app/root.tsx"),
  ciOptions: {
    usingArtifactsDir: "artifacts",
  },
});

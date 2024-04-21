import { ClientOnly } from "remix-utils/client-only";
import { Report } from "safetest/report";

export async function loader() {
  return null;
}

export default function MyReport() {
  return (
    <ClientOnly>
      {() => (
        <Report
          getTestUrl={(filename, test) => {
            const relativeFile = `./${filename}`.replace(/\.[jt]sx?$/g, "");
            const testName = test.trim().replace(/ /g, "+");
            return `${process.env.APP_URL}?test_path=${relativeFile}&test_name=${testName}`;
          }}
          renderArtifact={(type, path) => {
            if (type === "video")
              return <video src={`${process.env.DEPLOYED_URL}${path}`} controls />;
            return undefined;
          }}
        />
      )}
    </ClientOnly>
  );
}

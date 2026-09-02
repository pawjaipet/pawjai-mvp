import { jsonLdScriptValue } from "@/utils/json-ld";

export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLdScriptValue(data),
      }}
    />
  );
}

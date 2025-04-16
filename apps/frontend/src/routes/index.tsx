import { createFileRoute } from "@tanstack/react-router";
import { client } from "~/api";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const res = await client.api.hoge.foo.$get();
    const data = await res.text();
    return { data };
  },
});

function Home() {
  const { data } = Route.useLoaderData();
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <p>{data}</p>
      <button
        type="button"
        onClick={async () => {
          const res = await client.api.piyo.$post();
          console.log(await res.json());
        }}
      >
        PIYO
      </button>
    </div>
  );
}

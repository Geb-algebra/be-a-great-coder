import { Form } from "@remix-run/react";

export default function TurnHeader(props: {
  title: string;
  titleId?: string;
  finishButtonName?: string;
}) {
  return (
    <div className="h-12 mb-4 flex w-full justify-between items-center">
      <h1 id={props.titleId ?? ""} className="font-bold text-2xl">
        {props.title}
      </h1>
      <Form method="post">
        {!props.finishButtonName ? null : (
          <button
            type="submit"
            className="h-12 px-4 rounded-lg bg-accent-1 text-text-light hover:bg-accent-3 transition-colors duration-300"
          >
            {props.finishButtonName}
          </button>
        )}
      </Form>
    </div>
  );
}

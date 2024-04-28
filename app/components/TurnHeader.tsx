import { Form } from "@remix-run/react";
import { useContext } from "react";
import { ThemeContext } from "~/Contexts";

export default function TurnHeader(props: {
  title: string;
  titleId?: string;
  finishButtonName: string;
}) {
  const theme = useContext(ThemeContext);
  return (
    <div className="h-12 mb-4 flex w-full justify-between items-center">
      <h1 id={props.titleId ?? ""} className="font-bold text-2xl">
        {props.title}
      </h1>
      <Form method="post">
        <button
          type="submit"
          className={`h-12 px-4 rounded-lg bg-${theme}-accent-1 text-${theme}-text-light hover:bg-${theme}-accent-3 transition-colors duration-300`}
        >
          {props.finishButtonName}
        </button>
      </Form>
    </div>
  );
}

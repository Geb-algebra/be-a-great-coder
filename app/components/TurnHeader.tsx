import { Form } from "@remix-run/react";
import Button from "./Button";

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
          <Button type="submit" className="px-4 h-12">
            {props.finishButtonName}
          </Button>
        )}
      </Form>
    </div>
  );
}

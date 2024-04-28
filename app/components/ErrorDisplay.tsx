export default function ErrorDisplay(props: { message: string }) {
  return <p className="text-red-600 w-full flex items-center">{props.message}</p>;
}

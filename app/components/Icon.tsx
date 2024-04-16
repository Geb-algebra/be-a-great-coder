export default function Icon(props: { name: string; className?: string }) {
  return <p className={`material-icons w-6 h-6 ${props.className}`}>{props.name}</p>;
}

import { Card } from '../../components/ui';
import { Header } from './Header';

export function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <>
      <Header />
      <h1>{title}</h1>
      <Card tone="info">
        <p>{text}</p>
        <p>Ce module arrive dans une prochaine livraison. Daybakh : ça va aller 💛</p>
      </Card>
    </>
  );
}

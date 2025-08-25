import { fetchSleeperNews } from '@/lib/sleeper'
import Link from 'next/link'

interface PlayerPageProps {
  params: { id: string }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const news = await fetchSleeperNews([params.id])

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href="/dashboard" className="text-sm text-blue-600 underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">Player {params.id} News</h1>
      {news.length === 0 ? (
        <p>No recent news.</p>
      ) : (
        <ul className="space-y-4">
          {news.map((item) => (
            <li key={item.timestamp} className="border rounded-md p-4">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm mt-1">{item.body}</p>
              <div className="text-xs text-gray-500 mt-2">
                {item.source} • {new Date(item.timestamp * 1000).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

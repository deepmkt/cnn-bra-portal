import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Star, Flame, Medal, Award } from "lucide-react";

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: leaderboard = [] } = trpc.gamification.leaderboard.useQuery({ limit: 20 });
  const { data: allBadges = [] } = trpc.gamification.allBadges.useQuery();
  const { data: myData } = trpc.gamification.myPoints.useQuery(undefined, { enabled: isAuthenticated });

  const rankIcons = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#001c56] to-[#003399] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <span className="text-white/80 hover:text-white cursor-pointer"><ArrowLeft className="w-5 h-5" /></span>
          </Link>
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-lg font-black">Ranking de Leitores</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* My Stats */}
        {isAuthenticated && myData?.points && (
          <div className="bg-gradient-to-r from-[#001c56] to-[#003399] text-white rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/70">Seus Pontos</p>
                <p className="text-4xl font-black">{myData.points.totalPoints.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/70">Nível</p>
                <p className="text-4xl font-black">{myData.points.level}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-black">{myData.points.articlesRead}</p>
                <p className="text-xs text-white/60">Artigos Lidos</p>
              </div>
              <div>
                <p className="text-2xl font-black">{myData.points.commentsPosted}</p>
                <p className="text-xs text-white/60">Comentários</p>
              </div>
              <div>
                <p className="text-2xl font-black">{myData.points.sharesCount}</p>
                <p className="text-xs text-white/60">Compartilhamentos</p>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-400" />
                <p className="text-2xl font-black">{myData.points.streak}</p>
                <p className="text-xs text-white/60">dias</p>
              </div>
            </div>

            {/* My Badges */}
            {myData.badges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-white/60 mb-2">Seus Distintivos</p>
                <div className="flex flex-wrap gap-2">
                  {myData.badges.map((badge: any) => (
                    <span key={badge.id} className="bg-white/10 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                      {badge.iconEmoji} {badge.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-black text-gray-800 flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" /> Top Leitores
            </h2>
          </div>
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum leitor no ranking ainda. Seja o primeiro!</p>
            </div>
          ) : (
            <div className="divide-y">
              {leaderboard.map((entry: any) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 ${
                    user?.id === entry.userId ? "bg-blue-50" : "hover:bg-gray-50"
                  } transition-colors`}
                >
                  <div className="w-10 text-center">
                    {entry.rank <= 3 ? (
                      <span className="text-2xl">{rankIcons[entry.rank - 1]}</span>
                    ) : (
                      <span className="text-lg font-black text-gray-400">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-[#001c56] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (entry.name || "?")[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {entry.name || "Anônimo"}
                      {user?.id === entry.userId && <span className="text-xs text-[#001c56] ml-2">(você)</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      Nível {entry.level} · {entry.articlesRead} artigos · {entry.streak} dias seguidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#001c56]">{entry.totalPoints.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Badges */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-black text-gray-800 flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-500" /> Todos os Distintivos
          </h2>
          {allBadges.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nenhum distintivo disponível ainda.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allBadges.map((badge: any) => {
                const earned = myData?.badges?.some((b: any) => b.id === badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      earned ? "border-yellow-400 bg-yellow-50" : "border-gray-100 bg-gray-50 opacity-60"
                    }`}
                  >
                    <span className="text-3xl block mb-2">{badge.iconEmoji}</span>
                    <p className="font-bold text-sm text-gray-800">{badge.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                    <p className="text-xs text-[#001c56] font-bold mt-2">+{badge.pointsReward} pts</p>
                    {earned && <p className="text-xs text-green-600 font-bold mt-1">Conquistado!</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

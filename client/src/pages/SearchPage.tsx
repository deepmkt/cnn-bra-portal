import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, ArrowLeft, Clock, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { trackSearch } from "@/hooks/useAnalytics";

const CATEGORIES = ["TODOS", "POLÍTICA", "ECONOMIA", "ESPORTES", "TECNOLOGIA", "SAÚDE", "ENTRETENIMENTO", "MUNDO", "BRASIL", "GERAL"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");

  const { data: results = [], isLoading } = trpc.search.query.useQuery(
    { q: searchTerm, limit: 30 },
    { enabled: searchTerm.length > 0 }
  );

  const filtered = useMemo(() => {
    if (selectedCategory === "TODOS") return results;
    return results.filter((a: any) => a.category === selectedCategory);
  }, [results, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
      trackSearch(query.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#001c56] text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <span className="flex items-center gap-2 text-white/80 hover:text-white cursor-pointer transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </span>
          </Link>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar notícias, temas, categorias..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:bg-white/15"
                autoFocus
              />
            </div>
            <Button type="submit" className="bg-[#cc0000] hover:bg-[#a00000] text-white font-bold rounded-xl px-6">
              Buscar
            </Button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[#001c56] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {!searchTerm && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-400 mb-2">Busque por notícias</h2>
            <p className="text-gray-400">Digite um termo para encontrar artigos, reportagens e mais.</p>
          </div>
        )}

        {searchTerm && isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm && !isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-black text-gray-400 mb-2">Nenhum resultado</h2>
            <p className="text-gray-400">Tente buscar por outros termos ou categorias.</p>
          </div>
        )}

        {searchTerm && !isLoading && filtered.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "<strong>{searchTerm}</strong>"
              {selectedCategory !== "TODOS" && ` em ${selectedCategory}`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article: any) => (
                <Link key={article.id} href={`/artigo/${article.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                    {article.imageUrl && (
                      <div className="h-48 overflow-hidden">
                        <OptimizedImage
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#cc0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          {article.category}
                        </span>
                        {article.isBreaking && (
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded animate-pulse">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-[#001c56] transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTimeMinutes} min</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.viewCount}</span>
                        <span>{new Date(article.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

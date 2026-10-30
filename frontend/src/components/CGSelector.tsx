'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, ChevronDown } from 'lucide-react';

interface ConstructionGroup {
  id: string;
  code: string;
  name: string;
}

export default function CGSelector() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [constructionGroups, setConstructionGroups] = useState<ConstructionGroup[]>([]);
  const [selectedCG, setSelectedCG] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isSuperAdmin) return;

    const loadCGs = async () => {
      try {
        const [groupsResponse, filterResponse] = await Promise.all([
          fetch('/api/v1/construction-groups'),
          fetch('/api/v1/user/set-cg-filter'),
        ]);
        const data = groupsResponse.ok ? await groupsResponse.json() : {};
        const filter = filterResponse.ok ? await filterResponse.json() : {};
        setConstructionGroups(data.constructionGroups || []);

        const storedCG = localStorage.getItem('selectedCG');
        if (storedCG && storedCG !== filter.constructionGroupId) {
          setSelectedCG(storedCG);
          const saved = await fetch('/api/v1/user/set-cg-filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ constructionGroupId: storedCG }),
          });
          if (saved.ok) {
            window.location.replace(window.location.pathname + window.location.search);
            return;
          }
        } else if (filter.viewingAll) {
          setSelectedCG(null);
        } else if (filter.constructionGroupId || data.effectiveConstructionGroupId) {
          const activeId = filter.constructionGroupId || data.effectiveConstructionGroupId;
          setSelectedCG(activeId);
          localStorage.setItem('selectedCG', activeId);
        }
      } catch (error) {
        console.error('Failed to load construction groups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCGs();
  }, [isSuperAdmin]);

  const handleCGChange = async (cgId: string | null) => {
    const previousCG = selectedCG;
    setSelectedCG(cgId);
    setIsOpen(false);

    if (cgId) {
      localStorage.setItem('selectedCG', cgId);
    } else {
      localStorage.removeItem('selectedCG');
    }

    try {
      const response = await fetch('/api/v1/user/set-cg-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constructionGroupId: cgId }),
      });

      if (!response.ok) {
        console.error('Failed to set CG filter:', response.status);
        setSelectedCG(previousCG); // Revert on error
        return;
      }

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cg-filter-changed'));
      
      // Add a small delay to ensure cookie is set, then reload
      setTimeout(() => {
        // Use location.replace to navigate to current page without adding to history
        window.location.replace(window.location.pathname + window.location.search);
      }, 100);
    } catch (error) {
      console.error('Failed to set CG filter:', error);
      setSelectedCG(previousCG); // Revert on error
    }
  };

  if (!isSuperAdmin || loading) {
    return null;
  }

  const selectedCGData = selectedCG 
    ? constructionGroups.find(cg => cg.id === selectedCG)
    : null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="hidden sm:inline">
          {selectedCGData ? selectedCGData.code : 'All CGs'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Construction Group Filter
            </div>
            
            <button
              onClick={() => handleCGChange(null)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                !selectedCG ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <div>
                  <div className="font-medium">All Construction Groups</div>
                  <div className="text-xs text-gray-500">View data from all CGs</div>
                </div>
              </div>
            </button>

            <div className="border-t border-gray-200 my-1" />

            {constructionGroups.map((cg) => (
              <button
                key={cg.id}
                onClick={() => handleCGChange(cg.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  selectedCG === cg.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{cg.code}</div>
                    <div className="text-xs text-gray-500">{cg.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

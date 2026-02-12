import type { CommunityWithBrotherCount } from "@/types/communities";
import { useEffect, useState } from "react";

interface SelectedCommunity
  extends Pick<
    CommunityWithBrotherCount,
    "id" | "number_community" | "count_persons"
  > { }

export const ViewSelectedCommunities = () => {
  const [selectedCommunities, setSelectedCommunities] = useState<
    SelectedCommunity[]
  >([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        communities: SelectedCommunity[];
      }>;
      setSelectedCommunities(customEvent.detail.communities || []);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("retreat:communities-selected", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("retreat:communities-selected", handler);
      }
    };
  }, []);

  if (selectedCommunities.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Ninguna comunidad seleccionada todavía.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {selectedCommunities.map((community) => (
        <li key={community.id} className="text-sm p-2 px-3 rounded-full bg-gray-100 flex items-center justify-between border border-gray-200">
          <span>Comunidad {community.number_community}</span>
          <strong>({community.count_persons} Hermanos)</strong>
        </li>
      ))}
    </ul>
  );
};

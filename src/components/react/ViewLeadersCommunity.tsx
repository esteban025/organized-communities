import { useEffect, useState } from "react";
import { actions } from "astro:actions";
import type { BrotherwithRoles } from "@/types/brothers";

export const ViewLeadersCommunity = ({ communityId }: { communityId: number }) => {

  const [groupLeaders, setGroupLeaders] = useState<BrotherwithRoles[]>([]);
  const [groupCatechists, setGroupCatechists] = useState<BrotherwithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupLeaders = async () => {
      try {
        const { data, error } = await actions.getGroupLeaders({ communityId });
        if (error || !data?.success) {
          setError(data?.message || "Failed to fetch group leaders.");
          setIsLoading(false);
          return;
        }
        setGroupLeaders(data?.data);
        setIsLoading(false);

      } catch (err) {
        setError("An unexpected error occurred.");
        setIsLoading(false);
      }
    }
    fetchGroupLeaders();
  }, [communityId]);

  useEffect(() => {
    const fetchGroupCatechists = async () => {
      try {
        const { data, error } = await actions.getGroupCatechists({ communityId });
        if (error || !data?.success) {
          setError(data?.message || error?.message || "Failed to fetch group catechists.");
          setIsLoading(false);
          return;
        }
        setGroupCatechists(data?.data);
        setIsLoading(false);

      } catch (err) {
        setError("An unexpected error occurred.");
        setIsLoading(false);
      }
    }
    fetchGroupCatechists();
  }, [communityId]);


  return (
    <div className="ss">
      {isLoading && <p>Loading group leaders...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <>
          <ul>
            {groupLeaders.map((leader) => (
              <li key={leader.id}>
                {leader.names} {leader.phone} - Roles: {leader.roles}
              </li>
            ))}
          </ul>
          <ul>
            {groupCatechists.map((catechist) => (
              <li key={catechist.id}>
                {catechist.names} {catechist.phone} - Roles: {catechist.roles}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
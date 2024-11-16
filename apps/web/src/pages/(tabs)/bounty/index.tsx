import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Card, Chip, Text, Title } from "react-native-paper";
import parse from "html-react-parser";

import { useQuery } from "@tanstack/react-query";

import { useBounty } from "@/components/hooks/useBounty";
import { useModal } from "@/components/hooks/useModal";
import LoadingScreen from "@/components/Loading";
import { getAllBounties } from "@api/routes/get-all-bounties";
import { getUserPlatformAsset } from "@api/routes/get-user-platformAsset";
import { Bounty } from "@app/types/BountyTypes";
import { addrShort } from "@app/utils/AddrShort";
import { Color } from "app/utils/all-colors";
import { useRouter } from "next/router";
import MainLayout from "../layout";
import { useAuth } from "@/components/provider/AuthProvider";
import { ArrowUpZA } from "lucide-react";

export default function BountyScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [menuVisible, setMenuVisible] = useState(false);

  const { setData } = useBounty();
  const { onOpen } = useModal();
  const router = useRouter();
  const response = useQuery({
    queryKey: ["bounties"],
    queryFn: getAllBounties,
  });

  const balanceRes = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setMenuVisible(false);
    // Update filteredBounties based on selected filter
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await response.refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);

  const bountyList = response.data?.allBounty || [];
  const filteredBounties = useMemo(() => {
    return bountyList.filter((bounty: Bounty) => {
      if (selectedFilter === "Joined") return bounty.isJoined;
      if (selectedFilter === "Not Joined") return !bounty.isJoined;
      return true; // "All"
    });
  }, [selectedFilter, bountyList]);
  if (response.isLoading) return <LoadingScreen />;

  const toggleJoin = (id: string, isAlreadyJoin: boolean, bounty: Bounty) => {
    if (isAlreadyJoin) {
      setData({ item: bounty });
      router.push(`/(tabs)/bounty/${bounty.id}`);
    } else {
      onOpen("JoinBounty", { bounty: bounty, balance: balanceRes.data });
    }
  };
  const renderBountyItem = ({ item }: { item: Bounty }) => (
    <Card style={styles.card}>
      <Card.Cover
        source={{
          uri: item.imageUrls[0] ?? "https://app.wadzzo.com/images/loading.png",
        }}
        style={styles.cardCover}
      />
      <Card.Content>
        <Title>{item.title}</Title>
        <View
          style={{
            marginBottom: 8,
            maxHeight: 150,
            minHeight: 150,
          }}
        >
          <Text
            style={{
              color: "black",
            }}
          >
            {
              parse(
                item.description.length > 100
                  ? item.description.substring(0, 100)
                  : item.description
              ) // Parse HTML content
            }
          </Text>
        </View>
        <View style={styles.detailsContainer}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            {item.status}
          </Chip>
          <Text style={styles.prizeText}>
            Prize: {item.priceInUSD.toFixed(2)}$
          </Text>
          <Text style={styles.prizeText}>
            Prize : {item.priceInBand.toFixed(2)} Wadzzo
          </Text>
        </View>
        <Text style={styles.participantsText}>
          Participants: {item._count.participants}
        </Text>
        {item.winnerId && (
          <Text style={styles.winnerText}>
            Winner: {addrShort(item.winnerId, 15)}
          </Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button
          style={{ flex: 1 }}
          disabled={item.status === "REJECTED"}
          mode={item.isJoined ? "outlined" : "contained"}
          onPress={() => toggleJoin(item.id, item.isJoined, item)}
        >
          {item.isJoined ? "View Bounty" : "Join Bounty"}
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <MainLayout>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content
            titleStyle={{
              color: "white",
            }}
            title="Bounty"
            style={styles.title}
          />
          <TouchableOpacity
            style={{
              paddingHorizontal: 20,
            }}
            onPress={() => setMenuVisible((prev) => !prev)}
          >
            <ArrowUpZA />
          </TouchableOpacity>
        </Appbar.Header>
        {menuVisible && (
          <View style={styles.dropdown}>
            {["All", "Joined", "Not Joined"].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.dropdownItem,
                  selectedFilter === filter && styles.selectedDropdownItem,
                ]}
                onPress={() => handleFilterChange(filter)}
              >
                <Text style={styles.dropdownItemText}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {filteredBounties.length === 0 && (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>No Bounty found</Text>
          </View>
        )}
        <FlatList
          data={filteredBounties}
          renderItem={renderBountyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 80 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          style={styles.flatList}
        />
      </View>
    </MainLayout>
  );
}

const getStatusColor = (status: Bounty["status"]) => {
  switch (status) {
    case "APPROVED":
      return "#4CAF50";
    case "PENDING":
      return "#FFC107";
    case "REJECTED":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Dimensions.get("window").height,
  },
  dropdown: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "white",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "black",
  },
  selectedDropdownItem: {
    backgroundColor: "#eeeeee",
  },
  header: {
    backgroundColor: Color.wadzzo,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  title: {
    alignItems: "center",
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectedMenuItem: {
    fontWeight: "bold", // Bold text for selected option
    backgroundColor: Color.dark.primary, // Background color for selected option
    fontStyle: "italic", // Italic text for selected option
    borderRadius: 8, // Rounded corners for selected option
  },
  card: {
    marginBottom: 16,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  prizeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  participantsText: {
    fontSize: 14,
    marginTop: 8,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#4CAF50",
  },
  flatList: {
    flex: 1,
  },
  cardCover: {
    height: 200,
  },
});

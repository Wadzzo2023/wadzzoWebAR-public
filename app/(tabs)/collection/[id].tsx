import React, { useRef } from "react";
import {
  Animated,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Clipboard,
} from "react-native";
import { Appbar, Avatar } from "react-native-paper";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { useCollection } from "@/components/hooks/useCollection";
import { BASE_URL } from "@/components/utils/Common";
import { Color } from "@/components/utils/all-colors";
import { useLocationService } from "@/components/hooks/useLocationService";
import { LocationAddressDisplay } from "@/components/LocationAddressDisplay";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!);

// ─── Redeem Code Badge ─────────────────────────────────────────────────────────

const RedeemCodeBadge = ({
  code,
  isRedeemed,
}: {
  code: string;
  isRedeemed: boolean;
}) => {
  const [copied, setCopied] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const part1 = code.slice(0, 3);
  const part2 = code.slice(3, 6);

  return (
    <Animated.View style={[styles.redeemCard, { opacity: fadeAnim }]}>
      {/* Header row */}
      <View style={styles.redeemHeader}>
        <View style={styles.redeemIconWrap}>
          <Text style={styles.redeemIcon}>🎟</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.redeemLabel}>
            {isRedeemed ? "Reward Redeemed" : "Your Redeem Code"}
          </Text>
          <Text style={styles.redeemSub}>
            {isRedeemed
              ? "This reward has already been used"
              : "Read this code to the creator to claim your reward"}
          </Text>
        </View>
        {isRedeemed && (
          <View style={styles.redeemedBadge}>
            <Text style={styles.redeemedBadgeText}>✓ Used</Text>
          </View>
        )}
      </View>

      {/* Code blocks */}
      <View
        style={[
          styles.codeRow,
          isRedeemed && styles.codeRowRedeemed,
        ]}
      >
        {/* Part 1 */}
        <View style={styles.codeGroup}>
          {part1.split("").map((char, i) => (
            <View
              key={i}
              style={[
                styles.codeBlock,
                isRedeemed && styles.codeBlockRedeemed,
              ]}
            >
              <Text
                style={[
                  styles.codeChar,
                  isRedeemed && styles.codeCharRedeemed,
                ]}
              >
                {char}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.codeDash, isRedeemed && { color: "#aaa" }]}>
          –
        </Text>

        {/* Part 2 */}
        <View style={styles.codeGroup}>
          {part2.split("").map((char, i) => (
            <View
              key={i}
              style={[
                styles.codeBlock,
                isRedeemed && styles.codeBlockRedeemed,
              ]}
            >
              <Text
                style={[
                  styles.codeChar,
                  isRedeemed && styles.codeCharRedeemed,
                ]}
              >
                {char}
              </Text>
            </View>
          ))}
        </View>

        {/* Copy button — hidden if redeemed */}
        {!isRedeemed && (
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.copyBtnText}>{copied ? "✓" : "⎘"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isRedeemed && (
        <Text style={styles.redeemFooter}>One-time use · Not transferable</Text>
      )}
    </Animated.View>
  );
};

// ─── Action Button ─────────────────────────────────────────────────────────────

const ActionButton = ({
  icon,
  label,
  onPress,
  disabled,
  variant,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "default" | "muted";
}) => {
  const bg =
    disabled
      ? "#e0e0e0"
      : variant === "primary"
        ? Color.wadzzo
        : variant === "muted"
          ? "#f5f5f5"
          : "#fff";

  const textColor =
    disabled
      ? "#aaa"
      : variant === "primary"
        ? "#fff"
        : "#333";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[styles.actionBtn, { backgroundColor: bg }]}
    >
      <Text style={[styles.actionBtnIcon, { opacity: disabled ? 0.4 : 1 }]}>
        {icon}
      </Text>
      <Text style={[styles.actionBtnLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

const SingleCollectionItem = () => {
  const { data } = useCollection();
  const { setSingleAr } = useLocationService();
  const router = useRouter();

  if (!data.collections) return null;
  console.log("Collection data:", data.collections);
  const col = data.collections;
  const isRedeemed = col.isRedeemed === true;

  return (
    <View style={styles.container}>
      {/* Appbar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content
          title={col.title}
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 56 : 32 }}
      >
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: col.image_url }}
            style={[styles.heroImage, isRedeemed && styles.heroImageRedeemed]}
          />
          {/* Redeemed overlay */}
          {isRedeemed && (
            <View style={styles.redeemedOverlay}>
              <Text style={styles.redeemedOverlayText}>REDEEMED</Text>
            </View>
          )}
          {/* Brand pill */}
          <View style={styles.brandPill}>
            <Avatar.Image
              size={36}
              source={{ uri: col.brand_image_url }}
            />
            <Text style={styles.brandPillName} numberOfLines={1}>
              {col.brand_name}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Title + description */}
          <Text style={styles.titleText}>{col.title}</Text>
          <Text style={styles.descText}>{col.description}</Text>

          {/* Info chips */}
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                📍 {col.lat.toFixed(4)}, {col.lng.toFixed(4)}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                📍{" "}
                <LocationAddressDisplay
                  latitude={col.lat}
                  longitude={col.lng}
                />
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>🏷 ID: {col.id}</Text>
            </View>
            {isRedeemed && (
              <View style={[styles.chip, styles.chipRedeemed]}>
                <Text style={[styles.chipText, { color: "#888" }]}>
                  ✓ Redeemed
                </Text>
              </View>
            )}
          </View>

          {/* Redeem code badge */}
          {col.redeemCode && (
            <RedeemCodeBadge
              code={col.redeemCode}
              isRedeemed={isRedeemed}
            />
          )}

          {/* Map */}
          <View style={styles.mapWrap}>
            <MapView
              logoEnabled={false}
              attributionEnabled={false}
              style={styles.map}
            >
              <Camera
                zoomLevel={15}
                animationMode="none"
                centerCoordinate={[col.lng, col.lat]}
              />
              <MarkerView coordinate={[col.lng, col.lat]}>
                <Image
                  source={{ uri: col.image_url }}
                  style={styles.markerImage}
                />
              </MarkerView>
            </MapView>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <ActionButton
              icon="🌐"
              label="Visit"
              onPress={() => Linking.openURL(col.url ?? "https://app.wadzoo.com")}
            />
            <ActionButton
              icon="🎁"
              label="Claim"
              onPress={() =>
                Linking.openURL(new URL("maps/pins/my", BASE_URL).href)
              }
            />
            <ActionButton
              icon="🥽"
              label="AR"
              onPress={() => {
                setSingleAr(data.collections);
                router.push("/ARScreen");
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SingleCollectionItem;

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f8",
  },

  // Appbar
  appbar: {
    backgroundColor: Color.wadzzo,
    elevation: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  appbarTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  // Hero
  heroWrap: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  heroImageRedeemed: {
    opacity: 0.45,
  },
  redeemedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemedOverlayText: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 6,
    color: "rgba(255,255,255,0.75)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    transform: [{ rotate: "-15deg" }],
  },
  brandPill: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  brandPillName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // Body
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
    paddingBottom: Platform.OS === "ios" ? 80 : 32,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.3,
  },
  descText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chipRedeemed: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
  },
  chipText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
  },

  // Redeem Code Badge
  redeemCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e8e8ef",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: 14,
  },
  redeemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  redeemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f0faf5",
    alignItems: "center",
    justifyContent: "center",
  },
  redeemIcon: {
    fontSize: 18,
  },
  redeemLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  redeemSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  redeemedBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  redeemedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  codeRowRedeemed: {
    opacity: 0.45,
  },
  codeGroup: {
    flexDirection: "row",
    gap: 5,
  },
  codeBlock: {
    width: 40,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f5f5fa",
    borderWidth: 1.5,
    borderColor: "#e0e0ea",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  codeBlockRedeemed: {
    backgroundColor: "#ebebeb",
    borderColor: "#d5d5d5",
  },
  codeChar: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    fontVariant: ["tabular-nums"],
  },
  codeCharRedeemed: {
    color: "#aaa",
  },
  codeDash: {
    fontSize: 20,
    fontWeight: "300",
    color: "#ccc",
    marginHorizontal: 2,
  },
  copyBtn: {
    width: 42,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f0faf5",
    borderWidth: 1.5,
    borderColor: "#c8eedd",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  copyBtnText: {
    fontSize: 20,
    color: "#2ecc71",
  },
  redeemFooter: {
    fontSize: 11,
    color: "#bbb",
    textAlign: "center",
  },

  // Map
  mapWrap: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  map: {
    height: 180,
  },
  markerImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnIcon: {
    fontSize: 20,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
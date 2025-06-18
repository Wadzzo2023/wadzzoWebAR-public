import { Color } from "@/components/utils/all-colors";
import { StyleSheet, Platform } from "react-native";
export const mapScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  map: {
    flex: 1,
  },

  marker: {
    width: 40,
    height: 60,
  },
  markerImage: {
    width: "100%",
    height: "100%",
  },
  autoCollectButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    padding: 10,
    backgroundColor: Color.wadzzo,
    borderRadius: 8,
  },
  pinCollectedAnim: {
    position: "absolute",
    bottom: 300,
    left: "50%",
    marginLeft: -50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    backgroundColor: Color.wadzzo, // Your branding color here
  },
  pinImage: {
    width: 80,
    height: 80,
  },

  recenterButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 90 : 80,
    right: 10,
    backgroundColor: Color.white,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
    borderWidth: 2,
  },
  balance: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    gap: 4,
    top: 40,
    right: 10,
    backgroundColor: Color.wadzzo,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  welcome: {
    position: "absolute",
    top: 100,
    left: 10,
  },

  AR: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 150 : 140,
    right: 10,
    backgroundColor: Color.wadzzo,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  Refresh: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 90 : 80,
    right: 60,
    backgroundColor: Color.white,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  containerOnBoard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  randomButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  randomButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/AmbulancierLocation.css";
import L from "leaflet";

// ✅ Use import instead of require for Vite compatibility
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

// Fix leaflet default icon config
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: shadow,
});

const AmbulancierLocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLocation({ lat, lng });
          fetchAddress(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const fetchAddress = async (lat, lng) => {
    const apiKey = "AIzaSyCAjiPbGCPLmtVMALKK7tm0P2qLdRdlKZY"; // ✅ Your API Key
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Unable to retrieve address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Error fetching address.");
    }
  };

  return (
    <div className="location-container">
      <h2>📍 Ambulancier Live Location</h2>
      <button onClick={handleGetLocation} className="location-btn">
        Get Current Location
      </button>

      {address && (
        <div className="address-bar">
          <strong>Current Address:</strong> {address}
        </div>
      )}

      {location && (
        <div className="map-wrapper">
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "400px", width: "100%", marginTop: "20px" }}
          >
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>Your current location</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default AmbulancierLocation;

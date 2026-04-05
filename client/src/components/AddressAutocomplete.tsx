import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface AddressData {
  streetAddress: string;
  addressLine2?: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Start typing an address...",
  label = "Search Address",
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const autocompleteRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Check if Google Maps API is loaded
    const checkGoogleMaps = () => {
      if (typeof window !== "undefined" && (window as any).google?.maps?.places?.Autocomplete) {
        try {
          // Initialize Google Places Autocomplete
          const autocomplete = new (window as any).google.maps.places.Autocomplete(
            inputRef.current!,
            {
              types: ["address"],
              componentRestrictions: { country: [] }, // No country restriction - worldwide
            }
          );

          autocompleteRef.current = autocomplete;
          setIsReady(true);
          setError(null);

          // Listen for place selection
          const listener = autocomplete.addListener("place_changed", () => {
            try {
              const place = autocomplete.getPlace();

              if (!place.geometry) {
                console.log("No geometry found for place");
                return;
              }

              // Extract address components
              const components = place.address_components || [];

              const getComponent = (type: string): string => {
                const component = components.find((c: any) => c.types.includes(type));
                return component?.long_name || "";
              };

              const streetNumber = getComponent("street_number");
              const route = getComponent("route");
              const streetAddress = `${streetNumber} ${route}`.trim();
              const city = getComponent("locality") || getComponent("sublocality");
              const stateRegion =
                getComponent("administrative_area_level_1") ||
                getComponent("administrative_area_level_2");
              const postalCode = getComponent("postal_code");
              const country = getComponent("country");

              // Call the callback with the extracted address
              onAddressSelect({
                streetAddress,
                city,
                stateRegion,
                postalCode,
                country,
              });

              // Clear the input after selection
              setInputValue("");
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            } catch (err) {
              console.error("Error processing place selection:", err);
            }
          });

          return () => {
            listener();
          };
        } catch (err) {
          console.error("Error initializing Google Places Autocomplete:", err);
          setError("Address autocomplete is temporarily unavailable");
          setIsReady(false);
        }
      } else {
        // Google Maps not loaded yet, retry after a delay
        setTimeout(checkGoogleMaps, 500);
      }
    };

    checkGoogleMaps();
  }, [onAddressSelect]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-xs font-semibold">{label}</Label>}
      <div className="relative flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground absolute left-3 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isReady ? placeholder : "Loading address search..."}
          disabled={!isReady}
          className="rounded-xl bg-muted/30 pl-9"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

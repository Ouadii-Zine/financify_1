import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { defaultCalculationParameters } from '@/data/sampleData';
import { RatingType, InternalRating, SPRating, MoodysRating, FitchRating, CalculationParameters, TransitionMatrix } from '@/types/finance';
import { PlusCircle, Save, Trash2, Download, Upload, RotateCcw, Info, ChevronDown, ChevronRight } from 'lucide-react';
import ParameterService from '@/services/ParameterService';
import LoanDataService from '@/services/LoanDataService';
import CurrencyService, { ExchangeRate } from '@/services/CurrencyService';

// Liste des pays extraite du fichier Excel "Country of Operation" - traduite en anglais
const COUNTRIES = [
  "SOUTH AFRICA", "ALGERIA", "GERMANY", "ANGOLA", "NETHERLANDS ANTILLES",
  "SAUDI ARABIA", "ARGENTINA", "AUSTRALIA", "AUSTRIA", "AZERBAIJAN",
  "BAHAMAS", "BAHRAIN", "BELGIUM", "BERMUDA", "BOSNIA AND HERZEGOVINA",
  "BRAZIL", "BULGARIA", "CAMBODIA", "CAMEROON", "CANADA",
  "CAYMAN ISLANDS", "CHILE", "CHINA", "CYPRUS", "COLOMBIA",
  "CONGO", "DEMOCRATIC REPUBLIC OF THE CONGO", "REPUBLIC OF KOREA", "CROATIA", "CUBA",
  "IVORY COAST", "DENMARK", "DJIBOUTI", "DOMINICAN REPUBLIC", "EL SALVADOR",
  "SPAIN", "ESTONIA", "FINLAND", "FRANCE", "GABON",
  "GHANA", "GREECE", "GUERNSEY", "GUINEA", "EQUATORIAL GUINEA",
  "HONG KONG", "HUNGARY", "INDIA", "INDONESIA", "ISLAMIC REPUBLIC OF IRAN",
  "IRAQ", "IRELAND", "ICELAND", "ISRAEL", "ITALY",
  "JAPAN", "JERSEY", "JORDAN", "KAZAKHSTAN", "KENYA",
  "KUWAIT", "LAO PEOPLE'S DEMOCRATIC REPUBLIC", "LEBANON", "LIBYAN ARAB JAMAHIRIYA", "LUXEMBOURG",
  "THE FORMER YUGOSLAV REPUBLIC OF MACEDONIA", "MALAYSIA", "MALI", "MALTA", "MOROCCO",
  "MARSHALL ISLANDS", "MAURITIUS", "MEXICO", "MOZAMBIQUE", "NIGERIA",
  "NORWAY", "NEW ZEALAND", "OMAN", "UGANDA", "PAKISTAN",
  "PANAMA", "PAPUA NEW GUINEA", "NETHERLANDS", "PHILIPPINES", "POLAND",
  "PUERTO RICO", "PORTUGAL", "PERU", "QATAR", "UNITED KINGDOM",
  "RUSSIAN FEDERATION", "SERBIA", "SINGAPORE", "SLOVAKIA", "SLOVENIA",
  "SOMALIA", "SUDAN", "SWITZERLAND", "SWEDEN", "TAIWAN, PROVINCE OF CHINA",
  "CHAD", "CZECH REPUBLIC", "THAILAND", "TOGO", "TRINIDAD AND TOBAGO",
  "TUNISIA", "TURKEY", "UKRAINE", "URUGUAY", "VENEZUELA",
  "VIET NAM", "WALLIS AND FUTUNA", "YEMEN", "ZIMBABWE", "EGYPT",
  "UNITED ARAB EMIRATES", "UNITED STATES", "ISLE OF MAN", "BRITISH VIRGIN ISLANDS"
];

// Méthodes de calcul d'intérêts disponibles
const INTEREST_CALCULATION_METHODS = [
  "Mois de 30 jours/Année de 360 jours",
  "Nombre de jours réel / Nombre de jours réel", 
  "BOND",
  "Nombre de jours réel/Année de 360 jours",
  "Mois de 30 jours/Année de 365 jours",
  "Nombre de jours réel/Année de 365 jours",
  "BANK",
  "G365",
  "G5/6",
  "M30",
  "M30E",
  "n/a"
];

// Mapping des méthodes de calcul d'intérêts avec leurs informations associées
const INTEREST_METHOD_MAPPING: Record<string, {finalMethod: string, description: string, type: string}> = {
  "Mois de 30 jours/Année de 360 jours": { finalMethod: "30/360", description: "Convention 30/360 - Mois de 30 jours", type: "year fraction" },
  "Nombre de jours réel / Nombre de jours réel": { finalMethod: "Actual/Actual", description: "Nombre de jours réels sur nombre de jours réels", type: "year fraction" },
  "BOND": { finalMethod: "Bond", description: "Méthode obligataire standard", type: "year fraction" },
  "Nombre de jours réel/Année de 360 jours": { finalMethod: "Actual/360", description: "Jours réels sur base 360 jours", type: "Actual/360" },
  "Mois de 30 jours/Année de 365 jours": { finalMethod: "30/365", description: "Convention 30/365", type: "30/365" },
  "Nombre de jours réel/Année de 365 jours": { finalMethod: "Actual/365", description: "Jours réels sur base 365 jours", type: "Actual/365" },
  "BANK": { finalMethod: "Actual/360", description: "Méthode bancaire standard", type: "Actual/360" },
  "G365": { finalMethod: "Actual/365", description: "Méthode G365 - base 365", type: "Actual/365" },
  "G5/6": { finalMethod: "G5/6", description: "Méthode spéciale G5/6", type: "year fraction" },
  "M30": { finalMethod: "30/360", description: "Méthode M30 - base 30/360", type: "year fraction" },
  "M30E": { finalMethod: "30E/360", description: "Méthode M30E - 30E/360 européenne", type: "year fraction" },
  "n/a": { finalMethod: "default Actual/360", description: "Méthode par défaut", type: "default Actual/360" }
};

// Mapping des pays avec leurs informations associées (zone, group, europe/na, ocde)
const COUNTRY_MAPPING: Record<string, {zone: string, group: string, europeNa: string, ocde: string}> = {
  "SOUTH AFRICA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "ALGERIA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "GERMANY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "ANGOLA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "NETHERLANDS ANTILLES": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "SAUDI ARABIA": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "ARGENTINA": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "AUSTRALIA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "Y" },
  "AUSTRIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "AZERBAIJAN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "BAHAMAS": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "N" },
  "BAHRAIN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "BELGIUM": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "BERMUDA": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "N" },
  "BOSNIA AND HERZEGOVINA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "BRAZIL": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "BULGARIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "CAMBODIA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "CAMEROON": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "CANADA": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "Y" },
  "CAYMAN ISLANDS": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "N" },
  "CHILE": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "Y" },
  "CHINA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "CYPRUS": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "COLOMBIA": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "CONGO": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "DEMOCRATIC REPUBLIC OF THE CONGO": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "REPUBLIC OF KOREA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "Y" },
  "CROATIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "CUBA": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "IVORY COAST": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "DENMARK": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "DJIBOUTI": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "DOMINICAN REPUBLIC": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "EL SALVADOR": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "SPAIN": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "ESTONIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "FINLAND": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "FRANCE": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "GABON": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "GHANA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "GREECE": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "GUERNSEY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "GUINEA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "EQUATORIAL GUINEA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "HONG KONG": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "HUNGARY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "INDIA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "INDONESIA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "ISLAMIC REPUBLIC OF IRAN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "IRAQ": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "IRELAND": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "ICELAND": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "ISRAEL": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "Y" },
  "ITALY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "JAPAN": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "Y" },
  "JERSEY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "JORDAN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "KAZAKHSTAN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "KENYA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "KUWAIT": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "LAO PEOPLE'S DEMOCRATIC REPUBLIC": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "LEBANON": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "LIBYAN ARAB JAMAHIRIYA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "LUXEMBOURG": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "THE FORMER YUGOSLAV REPUBLIC OF MACEDONIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "MALAYSIA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "MALI": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "MALTA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "MOROCCO": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "MARSHALL ISLANDS": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "MAURITIUS": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "MEXICO": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "Y" },
  "MOZAMBIQUE": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "NIGERIA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "NORWAY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "NEW ZEALAND": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "Y" },
  "OMAN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "UGANDA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "PAKISTAN": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "PANAMA": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "PAPUA NEW GUINEA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "NETHERLANDS": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "PHILIPPINES": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "POLAND": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "PUERTO RICO": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "N" },
  "PORTUGAL": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "PERU": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "QATAR": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "UNITED KINGDOM": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "RUSSIAN FEDERATION": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "SERBIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "SINGAPORE": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "SLOVAKIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "SLOVENIA": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "SOMALIA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "SUDAN": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "SWITZERLAND": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "SWEDEN": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "TAIWAN, PROVINCE OF CHINA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "CHAD": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "CZECH REPUBLIC": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "THAILAND": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "TOGO": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "TRINIDAD AND TOBAGO": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "TUNISIA": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "TURKEY": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "Y" },
  "UKRAINE": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "URUGUAY": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "VENEZUELA": { zone: "South America", group: "Americas", europeNa: "Others", ocde: "N" },
  "VIET NAM": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "WALLIS AND FUTUNA": { zone: "Asia Pacific", group: "APAC", europeNa: "Others", ocde: "N" },
  "YEMEN": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "ZIMBABWE": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "EGYPT": { zone: "Africa", group: "EMEA", europeNa: "Others", ocde: "N" },
  "UNITED ARAB EMIRATES": { zone: "Middle East", group: "EMEA", europeNa: "Others", ocde: "N" },
  "UNITED STATES": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "Y" },
  "ISLE OF MAN": { zone: "Europe", group: "EMEA", europeNa: "Europe", ocde: "N" },
  "BRITISH VIRGIN ISLANDS": { zone: "North America", group: "Americas", europeNa: "North America", ocde: "N" }
};

// Extend the default parameters type to include priceFactor and spread

// TransitionMatrixTable component
interface TransitionMatrixTableProps {
  ratingType: RatingType;
  parameters: CalculationParameters;
  onTransitionChange: (fromRating: string, toRating: string, probability: number) => void;
}

const TransitionMatrixTable: React.FC<TransitionMatrixTableProps> = ({ 
  ratingType, 
  parameters, 
  onTransitionChange 
}) => {
  const ratings = parameters.ratingPDMappings[ratingType]?.map(r => r.rating) || [];
  const transitions = parameters.transitionMatrices[ratingType] || [];
  
  const getTransitionProbability = (from: string, to: string): number => {
    const transition = transitions.find(t => t.from === from && t.to === to);
    return transition ? transition.probability : 0;
  };

  const calculateRowSum = (fromRating: string): number => {
    return ratings.reduce((sum, toRating) => {
      return sum + getTransitionProbability(fromRating, toRating);
    }, 0);
  };

  if (ratings.length === 0) return <div>No ratings available for this type</div>;

  return (
    <div className="w-full">
      <div className="border rounded-lg max-h-96 overflow-auto">
        <Table className="text-xs relative">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-20 w-16 border-r">
                <div className="text-center">From \\ To</div>
              </TableHead>
              {ratings.map(rating => (
                <TableHead key={rating} className="text-center min-w-20 px-2 border-r">
                  {rating}
                </TableHead>
              ))}
              <TableHead className="text-center min-w-20 px-2 bg-muted/50">
                Row Sum
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.map(fromRating => {
              const rowSum = calculateRowSum(fromRating);
              const isRowSumValid = Math.abs(rowSum - 1.0) < 0.01; // Within 1% of 100%
              
              return (
                <TableRow key={fromRating}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium text-xs border-r">
                    {fromRating}
                  </TableCell>
                  {ratings.map(toRating => {
                    const probability = getTransitionProbability(fromRating, toRating);
                    const isMainDiagonal = fromRating === toRating;
                    
                    return (
                      <TableCell key={toRating} className="text-center p-1 border-r">
                        <Input
                          type="number"
                          value={(probability * 100).toFixed(2)}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) / 100;
                            if (!isNaN(newValue) && newValue >= 0 && newValue <= 1) {
                              onTransitionChange(fromRating, toRating, newValue);
                            }
                          }}
                          className={`w-18 h-8 text-xs text-center border-0 ${
                            isMainDiagonal 
                              ? 'bg-blue-50 focus:bg-blue-100' 
                              : 'bg-transparent focus:bg-white'
                          }`}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className={`text-center p-2 font-mono text-xs ${
                    isRowSumValid ? 'text-green-600' : 'text-red-600'
                  } bg-muted/50`}>
                    {(rowSum * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground mt-2 space-y-1">
        <p>* Values are shown as percentages. Each row should sum to 100%.</p>
        <p>* Diagonal elements (same rating) are highlighted in blue and typically have the highest probabilities.</p>
        <p>* Row sums are shown in green when close to 100%, red when significantly different.</p>
      </div>
    </div>
  );
};

const Parameters = () => {
  // Initialize with parameters from service
  const [parameters, setParameters] = useState<CalculationParameters>(() => {
    const loaded = ParameterService.loadParameters();
    return {
      ...loaded,
      priceFactor: loaded.priceFactor || 1.5,
      spread: loaded.spread || 0.2
    };
  });
  
  // State for managing which rating type is being edited
  const [selectedRatingType, setSelectedRatingType] = useState<RatingType>('sp');
  
  // State for saving/loading operations
  const [isSaving, setIsSaving] = useState(false);
  const [totalLoans, setTotalLoans] = useState(0);
  
  // State for collapsible sections
  const [isPDSectionOpen, setIsPDSectionOpen] = useState(false);
  const [isTransitionMatrixOpen, setIsTransitionMatrixOpen] = useState(true);
  
  // État pour la sélection des pays
  const [selectedCountry, setSelectedCountry] = useState<string>("FRANCE");
  const [countryInfo, setCountryInfo] = useState(COUNTRY_MAPPING["FRANCE"] || {zone: "", group: "", europeNa: "", ocde: ""});
  
  // État pour la sélection des méthodes de calcul d'intérêts
  const [selectedInterestMethod, setSelectedInterestMethod] = useState<string>("n/a");
  const [interestMethodInfo, setInterestMethodInfo] = useState(INTEREST_METHOD_MAPPING["n/a"] || {finalMethod: "", description: "", type: ""});
  
  // État pour la sélection des devises
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [currencyInfo, setCurrencyInfo] = useState<ExchangeRate>({currency: "USD", rate: 1});
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  
  const currencyService = CurrencyService.getInstance();
  
  // Update country info when country changes
  useEffect(() => {
    if (selectedCountry && COUNTRY_MAPPING[selectedCountry]) {
      setCountryInfo(COUNTRY_MAPPING[selectedCountry]);
    } else {
      setCountryInfo({zone: "", group: "", europeNa: "", ocde: ""});
    }
  }, [selectedCountry]);
  
  // Update interest method info when method changes
  useEffect(() => {
    if (selectedInterestMethod && INTEREST_METHOD_MAPPING[selectedInterestMethod]) {
      setInterestMethodInfo(INTEREST_METHOD_MAPPING[selectedInterestMethod]);
    } else {
      setInterestMethodInfo({ finalMethod: '', description: '', type: '' });
    }
  }, [selectedInterestMethod]);
  
  // Fetch exchange rates on component mount
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        const rates = await currencyService.fetchLiveRates();
        setExchangeRates(rates);
        
        // Load saved currency from parameters or set USD as default (matches API base)
        const savedCurrency = parameters.currency || 'USD';
        setSelectedCurrency(savedCurrency);
        
        const selectedRate = rates.find(rate => rate.currency === savedCurrency);
        if (selectedRate) {
          setCurrencyInfo(selectedRate);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    };
    
    fetchRates();
  }, [currencyService, parameters.currency]);
  
  // Update currency info when selected currency changes
  useEffect(() => {
    if (selectedCurrency && exchangeRates.length > 0) {
      const selectedRate = exchangeRates.find(rate => rate.currency === selectedCurrency);
      if (selectedRate) {
        setCurrencyInfo(selectedRate);
      }
    }
  }, [selectedCurrency, exchangeRates]);
  
  // Count total loans for display
  useEffect(() => {
    try {
      const loanDataService = LoanDataService.getInstance();
      const allLoans = loanDataService.getAllLoans(false); // Exclude samples
      setTotalLoans(allLoans.length);
    } catch (error) {
      console.error('Error counting loans:', error);
    }
  }, []);
  
  const handleSaveParameters = async () => {
    setIsSaving(true);
    
    try {
      // Update parameters with selected currency and exchange rate
      const updatedParameters = {
        ...parameters,
        currency: selectedCurrency as any, // Cast to Currency type
        exchangeRate: currencyInfo?.rate || 1.0
      };
      
      // Save parameters to localStorage
      ParameterService.saveParameters(updatedParameters);
      
      // Get the loan data service instance and update all loan calculations
      const loanDataService = LoanDataService.getInstance();
      
      // Show initial toast
    toast({
        title: "Saving Parameters...",
        description: "Updating all loan calculations and currency settings.",
      variant: "default"
    });
      
      // Update calculations (this might take a moment)
      await new Promise(resolve => {
        loanDataService.updateCalculationParams(updatedParameters);
        // Give it a moment to process
        setTimeout(resolve, 100);
      });
      
      // Emit event to notify other components that parameters were updated
      window.dispatchEvent(new CustomEvent('parameters-updated'));
      
      toast({
        title: "Parameters Saved & Applied",
        description: `Parameters saved successfully. Currency set to ${selectedCurrency}. All loans have been recalculated.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving parameters:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save parameters or update loan calculations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleResetToDefault = () => {
    const resetParams = ParameterService.resetToDefaults();
    const updatedParams = {
      ...resetParams,
      priceFactor: 1.5,
      spread: 0.2
    };
    
    setParameters(updatedParams);
    setSelectedCountry("FRANCE");
    setSelectedInterestMethod("n/a");
    
    // Fix transition matrices to generate complete data
    try {
      ParameterService.fixTransitionMatrices();
      const paramsWithMatrices = ParameterService.loadParameters();
      setParameters({
        ...paramsWithMatrices,
        priceFactor: 1.5,
        spread: 0.2
      });
    } catch (error) {
      console.error('Failed to fix transition matrices:', error);
    }
    
    // Update all loan calculations with reset parameters
    const loanDataService = LoanDataService.getInstance();
    loanDataService.updateCalculationParams(updatedParams);
    
    toast({
      title: "Parameters Reset & Applied",
      description: "All parameters restored to defaults, transition matrices loaded from fixed data files, and loan calculations updated.",
      variant: "default"
    });
  };

  const handleExportParameters = () => {
    try {
      const jsonString = ParameterService.exportParameters(parameters);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'calculation-parameters.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Parameters Exported",
        description: "Parameters have been exported to JSON file.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export parameters.",
        variant: "destructive"
      });
    }
  };

  const handleImportParameters = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const importedParams = ParameterService.importParameters(content);
            const updatedParams = {
              ...importedParams,
              priceFactor: importedParams.priceFactor || 1.5,
              spread: importedParams.spread || 0.2
            };
            
            setParameters(updatedParams);
            
            // Update all loan calculations with imported parameters
            const loanDataService = LoanDataService.getInstance();
            loanDataService.updateCalculationParams(updatedParams);
            
            toast({
              title: "Parameters Imported & Applied",
              description: "Parameters have been successfully imported and all loan calculations updated.",
              variant: "default"
            });
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Invalid parameter file format.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };


  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calculation Parameters</h1>
      

      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="stress">Stress Scenarios</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Parameters</CardTitle>
              <CardDescription>
                These parameters are used in all financial calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetROE">Target ROE (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="targetROE"
                      min={5} 
                      max={20} 
                      step={0.1} 
                      value={[parameters.targetROE * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        targetROE: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.targetROE * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum return required by shareholders
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corporateTaxRate">Corporate Tax Rate (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="corporateTaxRate"
                      min={10} 
                      max={40} 
                      step={0.5} 
                      value={[parameters.corporateTaxRate * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        corporateTaxRate: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.corporateTaxRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tax rate on corporate profits
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capitalRatio">Capital Ratio (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="capitalRatio"
                      min={8} 
                      max={20} 
                      step={0.1} 
                      value={[parameters.capitalRatio * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        capitalRatio: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.capitalRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CET1 Ratio (Common Equity Tier 1)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="useRegParameters">Use Regulatory Parameters</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="useRegParameters" />
                    <Label htmlFor="useRegParameters">
                      Enable
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use Basel III standard parameters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Parameters</CardTitle>
              <CardDescription>
                Parameters used in risk calculations and expected loss. Note: Funding costs and operational costs are frozen at loan creation time for new loans. Updated loans will use current parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fundingCost">Funding Cost (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="fundingCost"
                      min={0} 
                      max={10} 
                      step={0.05} 
                      value={[parameters.fundingCost * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        fundingCost: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.fundingCost * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average refinancing cost
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="operationalCostRatio">Operational Costs (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Slider 
                      id="operationalCostRatio"
                      min={0} 
                      max={5} 
                      step={0.05} 
                      value={[parameters.operationalCostRatio * 100]} 
                      onValueChange={(values) => setParameters({
                        ...parameters, 
                        operationalCostRatio: values[0] / 100
                      })} 
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-mono">
                      {(parameters.operationalCostRatio * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Operational cost ratio as % of loan amount
                  </p>
                </div>
              </div>
              
              {/* Rating System PD Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Rating Type:</Label>
                    <Select value={selectedRatingType} onValueChange={(value: RatingType) => setSelectedRatingType(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal Rating</SelectItem>
                        <SelectItem value="sp">S&P Rating</SelectItem>
                        <SelectItem value="moodys">Moody's Rating</SelectItem>
                        <SelectItem value="fitch">Fitch Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Collapsible open={isPDSectionOpen} onOpenChange={setIsPDSectionOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                      <h3 className="text-lg font-medium">Rating System PD Configuration</h3>
                      {isPDSectionOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure PD values for each {selectedRatingType === 'internal' ? 'Internal' : selectedRatingType === 'sp' ? 'S&P' : selectedRatingType === 'moodys' ? "Moody's" : 'Fitch'} rating. 
                        These values will be used for automatic PD calculation when loans use this rating type.
                        {selectedRatingType === 'internal' && (
                          <span className="block mt-2 text-green-700">
                            💡 <strong>Internal ratings only:</strong> You can add new ratings or delete existing ones using the buttons below.
                          </span>
                        )}
                        <strong className="block mt-2 text-blue-700">
                          When you save parameters, all existing loans with {selectedRatingType === 'internal' ? 'Internal' : selectedRatingType === 'sp' ? 'S&P' : selectedRatingType === 'moodys' ? "Moody's" : 'Fitch'} ratings 
                          will have their PD values automatically updated.
                        </strong>
                      </p>
                      
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">PD (%)</TableHead>
                    <TableHead className="text-center">Adjustment</TableHead>
                    {selectedRatingType === 'internal' && (
                      <TableHead className="text-center">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.ratingPDMappings[selectedRatingType]?.map((rating, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {selectedRatingType === 'internal' ? (
                          <Input
                            value={rating.rating}
                            onChange={(e) => {
                              const newMappings = { ...parameters.ratingPDMappings };
                              newMappings[selectedRatingType][index].rating = e.target.value as InternalRating;
                              setParameters({
                                ...parameters, 
                                ratingPDMappings: newMappings
                              });
                            }}
                            className="w-24"
                          />
                        ) : (
                          rating.rating
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">
                          {(rating.pd * 100).toFixed(4)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <Slider 
                            min={0.0001} 
                            max={1.0} 
                            step={0.0001} 
                            value={[rating.pd]} 
                            onValueChange={(values) => {
                              const newMappings = { ...parameters.ratingPDMappings };
                              newMappings[selectedRatingType][index].pd = values[0];
                              setParameters({
                                ...parameters, 
                                ratingPDMappings: newMappings
                              });
                            }} 
                            className="w-32"
                          />
                          <Input
                            type="number"
                            value={(rating.pd * 100).toFixed(4)}
                            onChange={(e) => {
                              const newPD = parseFloat(e.target.value) / 100;
                              if (!isNaN(newPD) && newPD >= 0 && newPD <= 1) {
                                const newMappings = { ...parameters.ratingPDMappings };
                                newMappings[selectedRatingType][index].pd = newPD;
                                setParameters({
                                  ...parameters, 
                                  ratingPDMappings: newMappings
                                });
                              }
                            }}
                            className="w-20 text-center text-xs"
                            step="0.0001"
                            min="0"
                            max="100"
                          />
                        </div>
                      </TableCell>
                      {selectedRatingType === 'internal' && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the rating "${rating.rating}"? This action cannot be undone.`)) {
                                const newMappings = { ...parameters.ratingPDMappings };
                                newMappings[selectedRatingType].splice(index, 1);
                                setParameters({
                                  ...parameters, 
                                  ratingPDMappings: newMappings
                                });
                                
                                toast({
                                  title: "Rating Deleted",
                                  description: `Internal rating "${rating.rating}" has been deleted.`,
                                  variant: "default"
                                });
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Add new rating button - only for internal ratings */}
              {selectedRatingType === 'internal' && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMappings = { ...parameters.ratingPDMappings };
                      const existingRatings = newMappings[selectedRatingType].map(r => r.rating);
                      let newRatingName = `NEW${newMappings[selectedRatingType].length + 1}`;
                      let counter = 1;
                      
                      // Ensure unique rating name
                      while (existingRatings.includes(newRatingName as InternalRating)) {
                        newRatingName = `NEW${newMappings[selectedRatingType].length + 1 + counter}`;
                        counter++;
                      }
                      
                      const newRating = {
                        rating: newRatingName as InternalRating,
                        pd: 0.01 // Default 1% PD
                      };
                      newMappings[selectedRatingType].push(newRating);
                      setParameters({
                        ...parameters, 
                        ratingPDMappings: newMappings
                      });
                      
                      toast({
                        title: "Rating Added",
                        description: `New internal rating "${newRatingName}" added with default PD of 1%.`,
                        variant: "default"
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Rating
                  </Button>
                </div>
              )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Transition Matrix Section */}
                <Collapsible open={isTransitionMatrixOpen} onOpenChange={setIsTransitionMatrixOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                      <h3 className="text-lg font-medium">
                        {selectedRatingType === 'internal' ? 'Internal' : 
                         selectedRatingType === 'sp' ? 'S&P' : 
                         selectedRatingType === 'moodys' ? "Moody's" : 'Fitch'} Rating Transition Matrix
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">One-year transition probabilities</span>
                        {isTransitionMatrixOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
              </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure one-year transition probabilities between ratings. Values represent the probability 
                        that a rating will migrate to another rating within one year. Each row should sum to 100%.
                      </p>
                      
                      <TransitionMatrixTable 
                        ratingType={selectedRatingType}
                        parameters={parameters}
                        onTransitionChange={(fromRating, toRating, probability) => {
                          const updatedTransitions = [...parameters.transitionMatrices[selectedRatingType]];
                          const transitionIndex = updatedTransitions.findIndex(
                            t => t.from === fromRating && t.to === toRating
                          );
                          
                          if (transitionIndex !== -1) {
                            updatedTransitions[transitionIndex].probability = probability;
                          } else {
                            updatedTransitions.push({ from: fromRating, to: toRating, probability });
                          }
                          
                          setParameters({
                            ...parameters,
                            transitionMatrices: {
                              ...parameters.transitionMatrices,
                              [selectedRatingType]: updatedTransitions
                            }
                          });
                        }}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              

            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Parameters used in pricing calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priceFactor">Pricing Factor</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="priceFactor"
                      type="number" 
                      step="0.01"
                      value={parameters.priceFactor} 
                      onChange={(e) => setParameters({
                        ...parameters, 
                        priceFactor: parseFloat(e.target.value)
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(parameters.priceFactor * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pricing factor for financial products
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spread">Spread (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="spread"
                      type="number" 
                      step="0.01"
                      value={parameters.spread} 
                      onChange={(e) => setParameters({
                        ...parameters, 
                        spread: parseFloat(e.target.value)
                      })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {(parameters.spread * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Spreads for financial products
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stress">
          <Card>
            <CardHeader>
              <CardTitle>Stress Scenarios</CardTitle>
              <CardDescription>
                Configure predefined scenarios for sensitivity analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario Name</TableHead>
                    <TableHead>PD x</TableHead>
                    <TableHead>LGD x</TableHead>
                    <TableHead>Rate Δ</TableHead>
                    <TableHead>Spread Δ</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.stressScenarios.map((scenario, index) => (
                    <TableRow key={index}>
                      <TableCell>{scenario.name}</TableCell>
                      <TableCell>{scenario.pdMultiplier.toFixed(2)}x</TableCell>
                      <TableCell>{scenario.lgdMultiplier.toFixed(2)}x</TableCell>
                      <TableCell>{scenario.rateShift > 0 ? '+' : ''}{(scenario.rateShift * 100).toFixed(0)} bp</TableCell>
                      <TableCell>{scenario.spreadShift > 0 ? '+' : ''}{(scenario.spreadShift * 100).toFixed(0)} bp</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Scenario</span>
                </Button>
                
                <Button 
                  className="flex items-center gap-2"
                  onClick={handleSaveParameters}
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Country Setup</CardTitle>
              <CardDescription>
                Select the default country for operations and view its associated information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                  {/* Country Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultCountry">Country</Label>
                    <select 
                      id="defaultCountry"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                      <option value="">-- Select a country --</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Zone */}
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {countryInfo.zone || "-"}
                    </div>
                  </div>
                  
                  {/* Group */}
                  <div className="space-y-2">
                    <Label>Group</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {countryInfo.group || "-"}
                    </div>
                  </div>
                  
                  {/* Europe/North America */}
                  <div className="space-y-2">
                    <Label>Europe/North America</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                      {countryInfo.europeNa || "-"}
                    </div>
                  </div>
                  
                  {/* OCDE */}
                  <div className="space-y-2">
                    <Label>OECD</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center justify-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        countryInfo.ocde === 'Y' 
                          ? 'bg-green-100 text-green-800' 
                          : countryInfo.ocde === 'N' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {countryInfo.ocde === 'Y' ? 'Yes' : countryInfo.ocde === 'N' ? 'No' : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Select a country to view its geographical zone, regional group, Europe/North America classification, and OECD membership status.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Currency Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Currency Setup</CardTitle>
              <CardDescription>
                Select the default currency for operations and view its exchange rate relative to USD.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                  {/* Currency Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Currency</Label>
                    <select 
                      id="defaultCurrency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                    >
                      <option value="">-- Select a currency --</option>
                      {exchangeRates.map((rate) => (
                        <option key={rate.currency} value={rate.currency}>
                          {rate.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Exchange Rate */}
                  <div className="space-y-2">
                    <Label>Exchange Rate (1 USD =)</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      {currencyInfo.rate ? (
                        <span className="font-medium">
                          {currencyInfo.rate.toFixed(4)} {selectedCurrency}
                        </span>
                      ) : '-'}
                    </div>
                  </div>
                  
                  {/* Currency Code */}
                  <div className="space-y-2">
                    <Label>Currency Code</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      <span className="font-medium text-blue-600">
                        {selectedCurrency || "-"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center justify-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isLoadingRates 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : selectedCurrency 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isLoadingRates ? 'Loading...' : selectedCurrency ? 'Live Rate' : 'Select Currency'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Select a currency to view its live exchange rate relative to USD.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Interest Calculation Methods Card */}
          <Card>
            <CardHeader>
              <CardTitle>Méthodes de Calcul d'Intérêts</CardTitle>
              <CardDescription>
                Sélectionnez la méthode de calcul d'intérêts par défaut et consultez ses informations associées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                  {/* Interest Method Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="interestMethod">Méthode de Calcul</Label>
                    <select 
                      id="interestMethod"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedInterestMethod}
                      onChange={(e) => setSelectedInterestMethod(e.target.value)}
                    >
                      <option value="">-- Sélectionner une méthode --</option>
                      {INTEREST_CALCULATION_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Final Method */}
                  <div className="space-y-2">
                    <Label>Méthode Finale</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        interestMethodInfo.finalMethod.includes('Actual') 
                          ? 'bg-blue-100 text-blue-800' 
                          : interestMethodInfo.finalMethod.includes('30') 
                            ? 'bg-green-100 text-green-800' 
                            : interestMethodInfo.finalMethod.includes('default')
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        {interestMethodInfo.finalMethod || "-"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Type */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        interestMethodInfo.type === 'year fraction' 
                          ? 'bg-purple-100 text-purple-800' 
                          : interestMethodInfo.type.includes('Actual') 
                            ? 'bg-cyan-100 text-cyan-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {interestMethodInfo.type || "-"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      {interestMethodInfo.description || "-"}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Sélectionnez une méthode de calcul d'intérêts pour voir sa méthode finale, son type et sa description.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportParameters}>
            <Download className="h-4 w-4 mr-2" />
            Export Parameters
          </Button>
          <Button variant="outline" onClick={handleImportParameters}>
            <Upload className="h-4 w-4 mr-2" />
            Import Parameters
          </Button>
        </div>
        
        <div className="flex space-x-2">
        <Button variant="outline" onClick={handleResetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
        </Button>
          <Button onClick={handleSaveParameters} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving & Updating...' : 'Save Parameters'}
        </Button>
        </div>
      </div>
    </div>
  );
};

export default Parameters;

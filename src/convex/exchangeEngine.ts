export interface ValuationBreakdown {
  step: string;
  percentage: number;
  absoluteValue: number;
  description: string;
}

export interface ValuationResult {
  basePrice: number;
  estimatedValue: number;
  priceRangeMin: number;
  priceRangeMax: number;
  breakdown: ValuationBreakdown[];
}

export function calculateRuleBasedValuation(
  basePrice: number,
  manufacturingYear: number,
  kilometers: number,
  ownerCount: number,
  insuranceValidity: string,
  serviceHistory: string,
  accidentHistory: string,
  vehicleCondition: string,
  tyreCondition: string
): ValuationResult {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - manufacturingYear);
  
  let currentPrice = basePrice;
  const breakdown: ValuationBreakdown[] = [];

  // Step 2: Age Depreciation
  let ageDepreciation = 0.25; // 10+ years fallback
  if (age <= 1) ageDepreciation = 0.95;
  else if (age === 2) ageDepreciation = 0.88;
  else if (age === 3) ageDepreciation = 0.80;
  else if (age === 4) ageDepreciation = 0.72;
  else if (age === 5) ageDepreciation = 0.65;
  else if (age === 6) ageDepreciation = 0.58;
  else if (age === 7) ageDepreciation = 0.50;
  else if (age === 8) ageDepreciation = 0.43;
  else if (age === 9) ageDepreciation = 0.36;
  
  const agePercentage = (ageDepreciation - 1) * 100;
  currentPrice = currentPrice * ageDepreciation;
  breakdown.push({
    step: "Age Depreciation",
    percentage: agePercentage,
    absoluteValue: currentPrice,
    description: `${age} years old (${agePercentage.toFixed(0)}%)`
  });

  // Step 3: Kilometer Deduction
  let kmDeduction = 0;
  if (kilometers > 150000) kmDeduction = -0.25;
  else if (kilometers > 100000) kmDeduction = -0.18;
  else if (kilometers > 75000) kmDeduction = -0.12;
  else if (kilometers > 50000) kmDeduction = -0.08;
  else if (kilometers > 25000) kmDeduction = -0.05;
  else if (kilometers > 10000) kmDeduction = -0.02;

  if (kmDeduction !== 0) {
    currentPrice = currentPrice * (1 + kmDeduction);
    breakdown.push({
      step: "Kilometer Deduction",
      percentage: kmDeduction * 100,
      absoluteValue: currentPrice,
      description: `${kilometers.toLocaleString()} km (${(kmDeduction * 100).toFixed(0)}%)`
    });
  }

  // Step 4: Owner Count
  let ownerDeduction = 0;
  if (ownerCount >= 4) ownerDeduction = -0.12;
  else if (ownerCount === 3) ownerDeduction = -0.07;
  else if (ownerCount === 2) ownerDeduction = -0.03;

  if (ownerDeduction !== 0) {
    currentPrice = currentPrice * (1 + ownerDeduction);
    breakdown.push({
      step: "Owner Deduction",
      percentage: ownerDeduction * 100,
      absoluteValue: currentPrice,
      description: `${ownerCount} Owners (${(ownerDeduction * 100).toFixed(0)}%)`
    });
  }

  // Step 5: Insurance
  let insuranceBonus = 0;
  if (insuranceValidity === "comprehensive") insuranceBonus = 0.02;
  else if (insuranceValidity === "expired") insuranceBonus = -0.03;

  if (insuranceBonus !== 0) {
    currentPrice = currentPrice * (1 + insuranceBonus);
    breakdown.push({
      step: "Insurance Factor",
      percentage: insuranceBonus * 100,
      absoluteValue: currentPrice,
      description: `${insuranceValidity} (${(insuranceBonus * 100).toFixed(0)}%)`
    });
  }

  // Step 6: Service History
  let serviceBonus = 0;
  if (serviceHistory === "authorized") serviceBonus = 0.03;
  else if (serviceHistory === "partial") serviceBonus = 0.01;
  else if (serviceHistory === "poor") serviceBonus = -0.05;

  if (serviceBonus !== 0) {
    currentPrice = currentPrice * (1 + serviceBonus);
    breakdown.push({
      step: "Service History Factor",
      percentage: serviceBonus * 100,
      absoluteValue: currentPrice,
      description: `${serviceHistory} (${(serviceBonus * 100).toFixed(0)}%)`
    });
  }

  // Step 7: Accident History
  let accidentDeduction = 0;
  if (accidentHistory === "minor") accidentDeduction = -0.04;
  else if (accidentHistory === "major") accidentDeduction = -0.10;
  else if (accidentHistory === "flood") accidentDeduction = -0.20;

  if (accidentDeduction !== 0) {
    currentPrice = currentPrice * (1 + accidentDeduction);
    breakdown.push({
      step: "Accident History Factor",
      percentage: accidentDeduction * 100,
      absoluteValue: currentPrice,
      description: `${accidentHistory} (${(accidentDeduction * 100).toFixed(0)}%)`
    });
  }

  // Step 8: Vehicle Condition
  let conditionBonus = 0;
  if (vehicleCondition === "excellent") conditionBonus = 0.05;
  else if (vehicleCondition === "good") conditionBonus = 0.02;
  else if (vehicleCondition === "poor") conditionBonus = -0.08;

  if (conditionBonus !== 0) {
    currentPrice = currentPrice * (1 + conditionBonus);
    breakdown.push({
      step: "Vehicle Condition Factor",
      percentage: conditionBonus * 100,
      absoluteValue: currentPrice,
      description: `${vehicleCondition} (${(conditionBonus * 100).toFixed(0)}%)`
    });
  }

  // Step 9: Tyre Condition
  let tyreBonus = 0;
  if (tyreCondition === "new") tyreBonus = 0.02;
  else if (tyreCondition === "replace") tyreBonus = -0.03;

  if (tyreBonus !== 0) {
    currentPrice = currentPrice * (1 + tyreBonus);
    breakdown.push({
      step: "Tyre Condition Factor",
      percentage: tyreBonus * 100,
      absoluteValue: currentPrice,
      description: `${tyreCondition} (${(tyreBonus * 100).toFixed(0)}%)`
    });
  }

  const estimatedValue = Math.round(currentPrice);

  // Calculate Price Range Based on Condition
  let rangeVariance = 0.08; // default average
  if (vehicleCondition === "excellent") rangeVariance = 0.03;
  else if (vehicleCondition === "good") rangeVariance = 0.05;
  else if (vehicleCondition === "poor") rangeVariance = 0.10;

  const priceRangeMin = Math.round(estimatedValue * (1 - rangeVariance));
  const priceRangeMax = Math.round(estimatedValue * (1 + rangeVariance));

  return {
    basePrice,
    estimatedValue,
    priceRangeMin,
    priceRangeMax,
    breakdown,
  };
}

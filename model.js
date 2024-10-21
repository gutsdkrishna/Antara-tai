// model.js

// 1. Subjective Weights Calculation
function calculateSubjectiveWeights(preferences) {
    const getPfn = (value) => {
        const pfnMappings = {
            1: { mu: 0.05, beta: 0.9 },
            2: { mu: 0.25, beta: 0.7 },
            3: { mu: 0.45, beta: 0.6 },
            4: { mu: 0.65, beta: 0.4 },
            5: { mu: 0.75, beta: 0.3 },
            6: { mu: 0.85, beta: 0.2 },
            7: { mu: 0.95, beta: 0.1 },
        };
        return pfnMappings[value] || null;
    };

    const geometricScore = ({ mu, beta }) => {
        const piAlpha = Math.sqrt(1 - (mu ** 2) - (beta ** 2));
        if (beta !== 0) {
            return (Math.atan(mu / beta) - (mu * beta)) / (3 - 2 * (mu ** 2 + beta ** 2));
        } else {
            return (piAlpha / 2) / (3 - 2 * (mu ** 2));
        }
    };

    const criteria = ['experience', 'fees', 'recommendation', 'education', 'availability'];
    let scoresSum = 0;
    const resultArray = [];

    criteria.forEach((criterion) => {
        const preference = preferences[criterion];
        const pfn = getPfn(parseInt(preference));
        const score = geometricScore(pfn);
        resultArray.push({ criterion, preference, pfn, score });
        scoresSum += score;
    });

    const normalizedScores = resultArray.map((item) => ({
        criterion: item.criterion,
        normalizedScore: (item.score / scoresSum).toFixed(3),
    }));

    return normalizedScores;
}

// 2. Objective Weight Calculation (CRITIC Method)
function criticWeights(matrix) {
    const benefitCols = ['exp', 'RS', 'edu', 'availability'];
    const costCols = ['Fees'];
    const normalizedData = {};

    benefitCols.forEach((col) => {
        const values = matrix.map(item => item[col]);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        normalizedData[col] = values.map(val => (val - minVal) / (maxVal - minVal));
    });

    const feesValues = matrix.map(item => item['Fees']);
    const minFee = Math.min(...feesValues);
    const maxFee = Math.max(...feesValues);
    normalizedData['Fees'] = feesValues.map(fee => (maxFee - fee) / (maxFee - minFee));

    const normMatrix = matrix.map((item, index) => ({
        exp: normalizedData['exp'][index],
        Fees: normalizedData['Fees'][index],
        RS: normalizedData['RS'][index],
        edu: normalizedData['edu'][index],
        availability: normalizedData['availability'][index],
    }));

    const stdDevs = benefitCols.concat(costCols).map(col => {
        const mean = normMatrix.reduce((sum, row) => sum + row[col], 0) / normMatrix.length;
        return Math.sqrt(normMatrix.reduce((sum, row) => sum + (row[col] - mean) ** 2, 0) / normMatrix.length);
    });

    const correlations = stdDevs.map(() => 1);

    const infoQuantities = stdDevs.map((stdDev, i) => stdDev * (1 - correlations[i]));

    const totalInfo = infoQuantities.reduce((sum, val) => sum + val, 0);
    const objWeights = infoQuantities.map(info => (info / totalInfo).toFixed(3));

    return objWeights;
}

// 3. Combine Subjective and Objective Weights
function combineWeights(objWeights, subWeights) {
    const combinedWeights = objWeights.map((objWeight, index) => {
        const combined = parseFloat(objWeight) * parseFloat(subWeights[index].normalizedScore);
        return combined;
    });

    const totalCombinedWeight = combinedWeights.reduce((sum, weight) => sum + weight, 0);
    return combinedWeights.map(weight => (weight / totalCombinedWeight).toFixed(3));
}

// 4. Ranking with MARCOS Method
function marcosMethod(alternatives, weights, types) {
    const weightedAlternatives = alternatives.map(alternative => {
        return alternative.map((value, index) => value * weights[index] * types[index]);
    });

    const scores = weightedAlternatives.map(alt => alt.reduce((sum, val) => sum + val, 0));

    const rankedAlternatives = scores.map((score, index) => ({ alternative: `A${index + 1}`, score }))
                                     .sort((a, b) => b.score - a.score);

    return rankedAlternatives;
}

// 5. Run Model
function runModel(preferences, jsonData) {
    const subjectiveWeights = calculateSubjectiveWeights(preferences);
    const objectiveWeights = criticWeights(jsonData);
    const combinedWeights = combineWeights(objectiveWeights, subjectiveWeights);

    // Define benefit (1) or cost (-1) types for each criterion
    const types = [1, -1, 1, 1, 1]; // 1 = benefit, -1 = cost

    // Extract data from JSON into a matrix
    const alternatives = jsonData.map(item => [
        item.exp,
        item.Fees,
        item.RS,
        item.edu,
        item.availability,
    ]);

    const rankedResults = marcosMethod(alternatives, combinedWeights, types);
    return rankedResults;
}

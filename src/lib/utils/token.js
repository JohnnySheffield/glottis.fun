import { ethers } from 'ethers';
import glottisMintAbi from './glottisMint.json';
import tokenAbi from './token.json';

export const GLOTTIS_MINT_ADDRESS = '0x543916e128A59abBc191Aa1dB2889A58f4732489';

export const TOKEN_ABI = tokenAbi.abi;
export const ERC20_ABI = tokenAbi.abi;

export const GLOTTIS_MINT_ABI = glottisMintAbi.abi;

export const EVENT_INTERFACE = [
    "event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 maxSupply, uint64[4] pricePoints)"
];

export const EVENT_SIGNATURE = ethers.utils.id('TokenCreated(address,string,string,uint256,uint64[4])');

// Price range and total ETH calculation functions
export function findMinPrice(points) {
    let minPrice = Infinity;
    for (let t = 0; t <= 1; t += 0.01) {
        const oneMinusT = 1 - t;
        const t2 = t * t;
        const t3 = t2 * t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;

        const term1 = oneMinusT3 * points[0];
        const term2 = 3 * oneMinusT2 * t * points[1];
        const term3 = 3 * oneMinusT * t2 * points[2];
        const term4 = t3 * points[3];

        const price = term1 + term2 + term3 + term4;
        minPrice = Math.min(minPrice, price);
    }
    return minPrice;
}

export function findMaxPrice(points) {
    let maxPrice = -Infinity;
    for (let t = 0; t <= 1; t += 0.01) {
        const oneMinusT = 1 - t;
        const t2 = t * t;
        const t3 = t2 * t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;

        const term1 = oneMinusT3 * points[0];
        const term2 = 3 * oneMinusT2 * t * points[1];
        const term3 = 3 * oneMinusT * t2 * points[2];
        const term4 = t3 * points[3];

        const price = term1 + term2 + term3 + term4;
        maxPrice = Math.max(maxPrice, price);
    }
    return maxPrice;
}

export function calculateTotalEth(points, supply) {
    const STEPS = 100;
    const stepSize = (supply/2) / STEPS;
    let totalEth = 0;

    for (let i = 0; i < STEPS; i++) {
        const t = i / STEPS;
        const oneMinusT = 1 - t;
        const t2 = t * t;
        const t3 = t2 * t;
        const oneMinusT2 = oneMinusT * oneMinusT;
        const oneMinusT3 = oneMinusT2 * oneMinusT;

        const term1 = oneMinusT3 * points[0];
        const term2 = 3 * oneMinusT2 * t * points[1];
        const term3 = 3 * oneMinusT * t2 * points[2];
        const term4 = t3 * points[3];

        const priceInWei = term1 + term2 + term3 + term4;
        totalEth += (priceInWei * 1e-18) * stepSize;
    }
    totalEth = totalEth / 1000000000

    return totalEth.toFixed(10);
}

// New fee fetching functions
export async function getProtocolFee(glottisMintContract) {
    try {
        const fee = await glottisMintContract.PROTOCOL_FEE();
        return ethers.utils.formatEther(fee);
    } catch (error) {
        console.error('Error fetching protocol fee:', error);
        return '0.0015'; // Fallback value
    }
}

export async function getCreatorFee(glottisMintContract) {
    try {
        const fee = await glottisMintContract.CREATOR_FEE();
        return ethers.utils.formatEther(fee);
    } catch (error) {
        console.error('Error fetching creator fee:', error);
        return '0.0010'; // Fallback value
    }
}

export async function getCallerFee(glottisMintContract) {
    try {
        const fee = await glottisMintContract.CALLER_FEE();
        return ethers.utils.formatEther(fee);
    } catch (error) {
        console.error('Error fetching caller fee:', error);
        return '0.0010'; // Fallback value
    }
}

export async function getBurnFee(glottisMintContract) {
    try {
        const fee = await glottisMintContract.BURN_FEE();
        return ethers.utils.formatEther(fee);
    } catch (error) {
        console.error('Error fetching burn fee:', error);
        return '0.0035'; // Fallback value
    }
}

export function getStepSize(maxSupply) {
    return maxSupply.div(2).div(100); // 1% of sale supply
}

export function getCurrentStep(totalSupply, maxSupply) {
    const stepSize = getStepSize(maxSupply);
    return totalSupply.div(stepSize).sub(1);
}

export function getStepStartSupply(totalSupply, maxSupply) {
    const stepSize = getStepSize(maxSupply);
    return totalSupply.div(stepSize).mul(stepSize);
}

export function getAvailableInStep(totalSupply, maxSupply) {
    const stepSize = getStepSize(maxSupply);
    const stepStartSupply = getStepStartSupply(totalSupply, maxSupply);
    const nextStepSupply = stepStartSupply.add(stepSize);
    return nextStepSupply.sub(totalSupply);
}

export function getCurrentPrice(pricePoints, progress) {
    if (!pricePoints || !Array.isArray(pricePoints)) return ethers.BigNumber.from(0);
    
    try {
        const GWEI_TO_WEI = ethers.BigNumber.from(10).pow(9);
        const pricePointsWei = pricePoints.map(price => 
            ethers.BigNumber.from(price).mul(GWEI_TO_WEI)
        );

        if (!progress || progress.eq(0)) {
            return pricePointsWei[0];
        }

        // Get price at the start of the current step
        const stepProgress = progress.div(ethers.constants.WeiPerEther.div(100)).mul(ethers.constants.WeiPerEther.div(100));
        
        const one = ethers.constants.WeiPerEther;
        const t18 = stepProgress;
        const oneMinusT = one.sub(t18);
        
        const oneMinusT2 = oneMinusT.mul(oneMinusT).div(one);
        const oneMinusT3 = oneMinusT2.mul(oneMinusT).div(one);
        const t2 = t18.mul(t18).div(one);
        const t3 = t2.mul(t18).div(one);

        const term1 = oneMinusT3.mul(pricePointsWei[0]).div(one);
        const term2 = oneMinusT2.mul(t18).mul(3).mul(pricePointsWei[1]).div(one).div(one);
        const term3 = oneMinusT.mul(t2).mul(3).mul(pricePointsWei[2]).div(one).div(one);
        const term4 = t3.mul(pricePointsWei[3]).div(one);

        return term1.add(term2).add(term3).add(term4);
    } catch (error) {
        console.error('Price calculation error:', error);
        return ethers.BigNumber.from(0);
    }
}

export async function getTokenProgress(provider, tokenAddress) {
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
    try {
        const totalSupply = await token.totalSupply();
        const maxSupply = await token.maxSupply();
        
        const saleSupply = maxSupply.div(2);
        const t = totalSupply.mul(ethers.constants.WeiPerEther).div(saleSupply);
        console.log(t.toString());
        return t;
    } catch (error) {
        console.error(`Error getting progress for token ${tokenAddress}:`, error);
        return ethers.BigNumber.from(0);
    }
}

export function formatPrice(price) {
    try {
        return ethers.utils.formatEther(price) + ' ETH';
    } catch (error) {
        console.error('Error formatting price:', error);
        return '0 ETH';
    }
}

export function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getGradientColor(ratio) {
    // Create a gradient from purple -> red -> yellow -> green
    const colors = [
        { pos: 0, r: 139, g: 92, b: 246 },  // Purple
        { pos: 0.33, r: 239, g: 68, b: 68 }, // Red
        { pos: 0.66, r: 234, g: 179, b: 8 }, // Yellow
        { pos: 1, r: 34, g: 197, b: 94 }     // Green
    ];
    
    // Find the two colors to interpolate between
    let start = colors[0];
    let end = colors[1];
    for (let i = 0; i < colors.length - 1; i++) {
        if (ratio >= colors[i].pos && ratio <= colors[i + 1].pos) {
            start = colors[i];
            end = colors[i + 1];
            ratio = (ratio - start.pos) / (end.pos - start.pos);
            break;
        }
    }
    
    // Interpolate between the two colors
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    
    return `rgba(${r}, ${g}, ${b}, 1)`;
}

export function drawBezierCurve(node, { pricePoints, progress, width = 800, height = 300 }) {
    const canvas = node;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, width, height);
    
    const NUM_STEPS = 100;
    const stepPoints = [];
    const GWEI_TO_WEI = ethers.BigNumber.from(10).pow(9);
    
    // Convert price points from GWEI to WEI
    const pricePointsWei = pricePoints.map(price => 
        ethers.BigNumber.from(price).mul(GWEI_TO_WEI)
    );
    
    const maxPrice = pricePointsWei.reduce((max, price) => 
        price.gt(max) ? price : max, 
        pricePointsWei[0]
    );

    const one = ethers.constants.WeiPerEther;

    // Calculate curve points and step boundaries
    for (let step = 0; step <= NUM_STEPS; step++) {
        const t = step / NUM_STEPS;
        const x = width * t;

        // Check for step boundary (every 1%)
        const isStepBoundary = step % (NUM_STEPS / 100) === 0;
        
        // Use exact t value instead of rounding
        const t18 = ethers.utils.parseUnits(t.toString(), 18);
        const oneMinusT = one.sub(t18);
        
        const oneMinusT2 = oneMinusT.mul(oneMinusT).div(one);
        const oneMinusT3 = oneMinusT2.mul(oneMinusT).div(one);
        const t2 = t18.mul(t18).div(one);
        const t3 = t2.mul(t18).div(one);

        const term1 = oneMinusT3.mul(pricePointsWei[0]).div(one);
        const term2 = oneMinusT2.mul(t18).mul(3).mul(pricePointsWei[1]).div(one).div(one);
        const term3 = oneMinusT.mul(t2).mul(3).mul(pricePointsWei[2]).div(one).div(one);
        const term4 = t3.mul(pricePointsWei[3]).div(one);

        const price = term1.add(term2).add(term3).add(term4);
        
        let yRatio;
        try {
            const priceStr = price.toString();
            const maxPriceStr = maxPrice.toString();
            yRatio = parseFloat(priceStr) / parseFloat(maxPriceStr);
            if (isNaN(yRatio)) yRatio = 0;
        } catch (e) {
            console.error('Error calculating ratio:', e);
            yRatio = 0;
        }
        
        const y = height - (yRatio * height * 0.8);
        stepPoints.push({ x, y, isStepBoundary });
    }

    // Draw the filled area
    ctx.beginPath();
    ctx.moveTo(stepPoints[0].x, height);
    for (const point of stepPoints) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.lineTo(stepPoints[stepPoints.length - 1].x, height);
    ctx.closePath();
    
    // Create gradient for fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw the main curve
    ctx.beginPath();
    ctx.moveTo(stepPoints[0].x, stepPoints[0].y);
    for (let i = 1; i < stepPoints.length; i++) {
        ctx.lineTo(stepPoints[i].x, stepPoints[i].y);
    }
    
    // Create gradient for curve
    const curveGradient = ctx.createLinearGradient(0, 0, width, 0);
    curveGradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
    curveGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.5)');
    curveGradient.addColorStop(1, 'rgba(34, 197, 94, 0.5)');
    
    ctx.strokeStyle = curveGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw step boundaries
    for (let i = 0; i < stepPoints.length; i++) {
        if (stepPoints[i].isStepBoundary) {
            const ratio = i / stepPoints.length;
            const gradientColor = getGradientColor(ratio);
            
            ctx.beginPath();
            ctx.strokeStyle = gradientColor.replace('1)', '0.3)'); // Make lines more subtle
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.moveTo(stepPoints[i].x, height);
            ctx.lineTo(stepPoints[i].x, stepPoints[i].y);
            ctx.stroke();
            // Short horizontal line at the top
            ctx.beginPath();
            ctx.strokeStyle = gradientColor;
            ctx.lineWidth = 1;
            ctx.moveTo(stepPoints[i].x, stepPoints[i].y);
            ctx.lineTo(stepPoints[i].x + 4, stepPoints[i].y);
            ctx.stroke();
        }
    }

    // Draw control points
    pricePointsWei.forEach((price, index) => {
        const x = width * (index / (pricePointsWei.length - 1));
        let yRatio;
        try {
            const priceStr = price.toString();
            const maxPriceStr = maxPrice.toString();
            yRatio = parseFloat(priceStr) / parseFloat(maxPriceStr);
            if (isNaN(yRatio)) yRatio = 0;
        } catch (e) {
            console.error('Error calculating price point ratio:', e);
            yRatio = 0;
        }
        const y = height - (yRatio * height * 0.8);
        
        // Glow effect for control points
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#4f46e5';
        ctx.fill();
    });

    // Draw progress indicator
    if (progress && !progress.isZero()) {
        const progressValue = parseFloat(ethers.utils.formatUnits(progress, 18));
        const clampedProgress = Math.min(Math.max(progressValue, 0), 1);
        const progressIndex = Math.floor(clampedProgress * NUM_STEPS);
        
        if (progressIndex < stepPoints.length) {
            const progressPoint = stepPoints[progressIndex];
            
            // Vertical progress line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
            ctx.setLineDash([2, 2]);
            ctx.moveTo(progressPoint.x, height);
            ctx.lineTo(progressPoint.x, progressPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Progress point with glow
            ctx.beginPath();
            ctx.arc(progressPoint.x, progressPoint.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(progressPoint.x, progressPoint.y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#22c55e';
            ctx.fill();
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    return {
        destroy() {}
    };
}

export function getTokenStatus(progress) {
    if (!progress) return { text: 'Inactive', color: 'gray', dotColor: 'bg-gray-500', textColor: 'text-gray-400' };
    
    const progressValue = Number(ethers.utils.formatUnits(progress, 18)) * 100;
    
    if (progressValue < 100) {
        return {
            text: 'Bonding Curve Active',
            dotColor: 'bg-emerald-500',
            textColor: 'text-emerald-400',
            progress: progressValue.toFixed(8) + '%'
        };
    } else if (progressValue === 100) {
        return {
            text: 'Bonding Complete - Awaiting Uniswap',
            dotColor: 'bg-yellow-500',
            textColor: 'text-yellow-400',
            progress: '100%'
        };
    } else if (progressValue === 200) {
        return {
            text: 'Uniswap Market Deployed',
            dotColor: 'bg-blue-500',
            textColor: 'text-blue-400',
            progress: '200%'
        };
    }
    
    return {
        text: 'Unknown Status',
        dotColor: 'bg-gray-500',
        textColor: 'text-gray-400',
        progress: progressValue.toFixed(1) + '%'
    };
}

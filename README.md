> :warning: **Development Status: Pre-audit & Non-Production** 
> This repo is under active development, has not yet undergone a formal security audit, and is experimental in nature. We strongly advise against using this code in production environments at this stage.


# Glottis Protocol Frontend

A permissionless protocol for creating and trading tokens with customizable Bézier bonding curves, designed to ensure fair token launches and efficient price discovery.

## Overview

Glottis Protocol introduces a novel approach to token launches using stepwise Bézier curves and UniswapV2 pools. The protocol enables creators to design custom bonding curves that define token price trajectories, providing more control over token distribution and market dynamics.

## Features

- Custom Bézier curve configuration for token price trajectories
- Integration with UniswapV2 for enhanced liquidity
- Fair and transparent token launch mechanism
- Real-time price discovery based on curve parameters
- Interactive curve visualization and trading interface

## Development

This project uses Svelte with Vite for the frontend and integrates with Ethereum smart contracts.

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Web3 wallet (e.g., MetaMask)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

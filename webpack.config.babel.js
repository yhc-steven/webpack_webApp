import { resolve } from 'path';
import {
	DefinePlugin,
	EnvironmentPlugin,
	IgnorePlugin,
	optimize,
} from 'webpack';
import WXAppWebpackPlugin, { Targets } from 'wxapp-webpack-plugin';
import MinifyPlugin from 'babel-minify-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import pkg from './package.json';
import config from './config/env';

const { NODE_ENV } = process.env;
const isDev = NODE_ENV !== 'production';
const srcDir = resolve('src');
debugger
const copyPatterns = []
	.concat(pkg.copyWebpack || [])
	.map(
		(pattern) =>
			typeof pattern === 'string' ? { from: pattern, to: pattern } : pattern,
	);

export default (env = {}) => {
	const min = env.min;
	const target = env.target || 'Wechat';
	const isWechat = env.target !== 'Alipay';


	const relativeFileLoader = (ext = '[ext]') => {
		return {
			loader: 'file-loader',
			options: {
				useRelativePath: true,
				name: `[name].${ext}`,
				context: srcDir,
			},
		};
	};

	return {
		entry: {
			app: './src/app.js'
		},
		output: {
			filename: '[name].js',
			publicPath: '/',
			path: resolve(__dirname,'./dist'),
		},
		target: Targets[target],
		module: {
			rules: [
				{
					test: /\.js$/,
					include: /src/,
					exclude: /node_modules/,
					use: ['babel-loader'].filter(Boolean),
				},
				{
					test: /\.(scss|css)$/,
					include: /src/,
					use: [
						relativeFileLoader('css'),
						{
							loader: 'sass-loader'
						},
					],
				},
				{
					test: /\.(json|png|jpg|gif)$/,
					include: /src/,
					use: relativeFileLoader(),
				},
				{
					test: /\.(wxml|swan)$/,
					include: /src/,
					use: [
						relativeFileLoader('swan'),
						{
							loader: 'wxml-loader',
							options: {
								root: srcDir,
								enforceRelativePath: true,
							},
						},
					],
				},
			],
		},
		plugins: [
			new EnvironmentPlugin({
				NODE_ENV: 'dev',
			}),
			new DefinePlugin({
				APIMSG: srcDir,
				API: config[NODE_ENV].API,
				APIMP: config[NODE_ENV].APIMP,
				ASSETS: config[NODE_ENV].ASSETS,
				APPID: config[NODE_ENV].APPID
			}),
			new WXAppWebpackPlugin({
				clear: !isDev,
			}),
			new optimize.ModuleConcatenationPlugin(),
			new IgnorePlugin(/vertx/),
			min && new MinifyPlugin(),
			new CopyPlugin(copyPatterns, { context: srcDir }),
		].filter(Boolean),
		devtool: isDev ? 'source-map' : false,
		resolve: {
			modules: [resolve(__dirname, 'src'), 'node_modules'],
		},
		watchOptions: {
			ignored: /dist|manifest/,
			aggregateTimeout: 300,
		},
	};
};

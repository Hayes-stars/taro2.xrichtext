/**
 * 小程序解析富文本组件
 */

import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, Block, Button, Video } from '@tarojs/components'

import HtmlToJson from './utils/html2json'
import showdown from './utils/showdown.js'
import { getSystemInfo, cacheInstance, getUniqueKey } from './utils/util'

import CustomAudio from './CustomAudio'

import Page from '~/utils/pages'

import './MpParseHtml.scss'

const BIND_NAME = 'WxParse'

/**
 * props属性
 */
interface MPHProps {
	/**
	 * 页面标识符
	 */
	pageKey?: string
	/**
	 * 当前根节点标识符
	 */
	rootKey?: string
	/**
	 * 解析语言类型
	 */
	language?: string // 'html' | 'markdown' (md)
	nodes: any
}

/**
 * 组件内部属性
 */
interface MPHState {
	pageNodeKey: string
	wxparseRootKey: string
	nodesData: Array<any>
	bindData: any
	imageWidth: any
	imageHeight: any
}

class MpParseHtml extends Component<MPHProps, MPHState> {
	static defaultProps: MPHProps = {
		pageKey: '',
		rootKey: '',
		language: 'html',
		nodes: null
	}

	constructor(props) {
		super(props)
		this.state = {
			pageNodeKey: '',
			wxparseRootKey: '',
			nodesData: [],
			bindData: null,
			imageWidth: null,
			imageHeight: null
		}
	}

	componentWillMount() {
		if (this.props.nodes) {
			console.log('componentWillMount props----------', this.props)
			this.getNodesData(this.props)
		}
	}

	componentWillReceiveProps(nextProps) {
		// props变更，监听nodes数据
		if (
			this.props.nodes &&
			JSON.stringify(this.props.nodes) !== JSON.stringify(nextProps.nodes)
		) {
			console.log(
				'componentWillReceiveProps props----------',
				nextProps,
				this.props
			)
			this.getNodesData(nextProps)
		}
	}

	componentWillUnmount() {
		// 组件销毁，清除当前页面绑定的所有wxparse实例
		cacheInstance.removeAllByKey(this.props.pageKey)
	}

	// 获取解析后的nodes数据
	getNodesData(props) {
		const { language, nodes } = props
		console.log('getNodesData nodes-----------', nodes)
		// 采用markdown解析
		if (language === 'markdown' || language === 'md') {
			const converter = new showdown.Converter()
			const parseNodes = converter.makeHtml(nodes)
			setTimeout(() => {
				this.handleParseNodes(parseNodes)
			}, 0)
		} else {
			// 默认采用html解析
			setTimeout(() => {
				this.handleParseNodes(nodes)
			}, 0)
		}
	}

	/**
	 * 解析节点
	 * @param nodes 节点对象
	 */
	handleParseNodes(nodes) {
		// console.log('handleParseNodes===', nodes)
		let data: any = []
		if (typeof nodes === 'string') {
			// 初始为html富文本字符串
			this.handleParseHtml(nodes).then(res => {
				data = res
			})
		} else {
			// 判断是否解析出来节点数组，其余则为节点对象，需自构建成数组格式
			const nodesData =
				Object.prototype.toString.call(nodes) === '[object Array]'
					? nodes
					: [nodes]
			data = nodesData
			this.setState({
				nodesData
			})
			// console.log('handleParseNodes 节点解析结果data------', data)
			return data
		}
	}

	/**
	 * 解析html标签
	 * @param html html标签字符对象
	 */
	handleParseHtml(html) {
		return new Promise((resolve, reject) => {
			try {
				// 生成page，wxparse根节点标识符
				const allPages = Taro.getCurrentPages(),
					currentPage = allPages[allPages.length - 1],
					pageNodeKey = `${BIND_NAME}_${currentPage.__wxExparserNodeId__}`,
					wxparseRootKey = `${pageNodeKey}_${getUniqueKey()}`

				//存放html节点转化后的json数据
				const transData = HtmlToJson.html2json(html, wxparseRootKey)
				transData.view = {}
				transData.view.imagePadding = 0
				console.log('handleParseHtml===transData---', transData)
				resolve(transData.nodes)
				this.setState({
					wxparseRootKey,
					pageNodeKey,
					nodesData: transData.nodes,
					bindData: {
						[wxparseRootKey]: transData
					}
				})
				// 构建page页面对象内部的wxparse富文本节点数组集合 eg: pageId => [wxparse1key, wxparse2key, ....]
				const pageInstance = cacheInstance.get(pageNodeKey)
				if (pageInstance) {
					pageInstance.push(wxparseRootKey)
				} else {
					cacheInstance.set(pageNodeKey, [wxparseRootKey])
				}
				cacheInstance.set(wxparseRootKey, transData)
				// 作调试用，注释打开可以查看HTML解析出来的dom结构
				// console.log(this.state)
			} catch (error) {
				reject(JSON.stringify(error))
			}
		})
	}

	/**
	 * 图片视觉宽高计算函数区
	 */
	wxParseImgLoad(e) {
		// 获取当前的image node节点
		const { from: tagFrom } = e.target.dataset || {}
		if (typeof tagFrom !== 'undefined' && tagFrom.length > 0) {
			const { width, height } = e.detail

			//因为无法获取view宽度 需要自定义padding进行计算，稍后处理
			const recal: any = this.wxAutoImageCal(width, height)
			const { imageWidth, imageHeight } = recal
			this.setState({
				imageWidth,
				imageHeight
			})
		}
	}

	/**
	 * 图片预览
	 */
	wxParseImgTap(e) {
		const { src = '', from = '', goodurl } = e.target.dataset || {}
		const cacheKey = this.props.rootKey || this.state.wxparseRootKey || from
		const { imageUrls = [] } = cacheInstance.get(cacheKey) || {}
		if (goodurl) {
			// 如果是自定义商品推广跳商品详情页
			Taro.navigateTo({
				url: goodurl
			})
		} else {
			Taro.previewImage({
				current: src,
				urls: imageUrls
			})
		}
	}

	/**
	 * 计算视觉优先的图片宽高
	 * @param originalWidth
	 * @param originalHeight
	 */
	wxAutoImageCal(originalWidth, originalHeight) {
		let autoWidth = 0,
			autoHeight = 0
		const results: any = {}
		const [windowWidth] = getSystemInfo()

		// 判断按照哪种方式进行缩放
		if (originalWidth > windowWidth) {
			// 在图片width大于手机屏幕width时候
			autoWidth = windowWidth
			autoHeight = (autoWidth * originalHeight) / originalWidth
			results.imageWidth = autoWidth
			results.imageHeight = autoHeight
		} else {
			// 否则展示原来数据
			results.imageWidth = originalWidth
			results.imageHeight = originalHeight
		}
		return results
	}

	/**
	 * 增加a标签跳转
	 *  1. 如果page页面有handleTagATap事件，优先采用事件回调的方式处理
	 *  2. 如果page页面没有handleTagATap事件，根据链接字段判断采用内外链跳转方式
	 */
	wxParseTagATap(e) {
		const { src = '' } = e.currentTarget.dataset

		// 采用递归组件方式渲染，不能通过triggerEvent方式向父级传参，可以获取当前页面调用页面方法处理
		const curPages = Taro.getCurrentPages()
		const currentPage = curPages[curPages.length - 1]
		if (currentPage && currentPage.handleTagATap) {
			currentPage.handleTagATap(src)
			return
		}

		// 判断是否内部链接跳转
		const isInnerPage = src.indexOf('http') === -1
		if (isInnerPage) {
			Taro.navigateTo({
				url: src
			})
		} else {
			Page.jumpToOutside(src, 'navigateTo')
		}
	}

	/**
	 * 渲染富文本html函数组件
	 */
	renderRichText(props) {
		const {
			nodesData,
			wxparseRootKey,
			pageNodeKey,
			imageHeight,
			imageWidth
		} = props
		// console.log('render01 props ------: ------:::', props)

		const item = nodesData
		const childNodes =
			Array.isArray(item.nodes) && item.nodes.length ? item.nodes : []
		const textArray =
			Array.isArray(item.textArray) && item.textArray.length
				? item.textArray
				: []
		let domHtml: any = null
		if (item.node === 'element') {
			// console.log('render01 element------:::------', item)
			if (item.tag === 'button') {
				// console.log('render01 button------')
				domHtml = (
					<Button type='default' size='mini'>
						{childNodes.map((child, idx) => {
							return (
								<Block key={`wxParse-button-inner-${idx}`}>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</Button>
				)
			} else if (item.tag === 'ol') {
				// console.log('render01 ol------')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-ol mb10`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<View
									className='wxParse-ol-inner'
									key={`wxParse-ol-inner-${idx}`}
								>
									<View className='wxParse-ol-number'>{idx + 1}. </View>
									<View className='flex-full overflow-hide'>
										{this.renderChildDom({
											nodesData: child,
											wxparseRootKey,
											pageNodeKey
										})}
									</View>
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'ul') {
				// console.log('render01 ul------')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-ul mb10`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<View
									className='wxParse-ul-inner'
									key={`wxParse-ul-inner-${idx}`}
								>
									<View className='wxParse-li-circle'></View>
									<View className='flex-full overflow-hide'>
										{this.renderChildDom({
											nodesData: child,
											wxparseRootKey,
											pageNodeKey
										})}
									</View>
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'li') {
				// console.log('render01 li------')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-li`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<View key={`liChild-${idx}`}>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'video') {
				// console.log('render01 video------')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-${item.tag}`}
						style={`${item.styleStr || ''}`}
					>
						<Video
							className={`${item.classStr || ''} wxParse-${item.tag}-video`}
							src={item.attr.src}
						></Video>
					</View>
				)
			} else if (item.tag === 'img') {
				// console.log('item.tag img render01===', item)
				domHtml = (
					<View className='wxParse-img-inner'>
						<Image
							className={`${item.classStr || ''} wxParse-${
								item.tag
							} wxParse-img-fadein`}
							data-from={item.from}
							data-src={item.attr.src}
							data-idx={item.imgIndex}
							data-goodurl={item.attr.goodurl}
							lazyLoad
							src={item.attr.src}
							onClick={this.wxParseImgTap.bind(this)}
							mode='widthFix'
							onLoad={this.wxParseImgLoad.bind(this)}
							style={{
								width: `${item.attr.width || imageWidth}px`,
								height: `${item.attr.height || imageHeight}px`
							}}
						/>
					</View>
				)
			} else if (item.tag === 'a') {
				// console.log('render01 aaaaaa------')
				domHtml = (
					<View
						className={`wxParse-inline ${item.classStr || ''} wxParse-${
							item.tag
						}`}
						data-title={item.attr.title}
						data-src={item.attr.href}
						style={`${item.styleStr || ''}`}
						onClick={this.wxParseTagATap.bind(this)}
					>
						{childNodes.map((child, idxA) => {
							return (
								<Block key={`aTagChild-${idxA}`}>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			} else if (item.tag === 'table') {
				// console.log('render01 table------')
				domHtml = (
					<View className={`${item.classStr || ''} wxParse-${item.tag}`}>
						{childNodes.map((child, idxTable) => {
							return (
								<Block key={`tableChild-${idxTable}`}>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			} else if (item.tag === 'tr') {
				// console.log('render01 tr------')
				domHtml = (
					<View className={`${item.classStr || ''} wxParse-${item.tag}`}>
						{childNodes.map((child, idxtr) => {
							const childStyleStr = child.styleStr || {}
							return (
								<View
									className={`${child.classStr || ''} wxParse-${
										child.tag
									} wxParse-${child.tag}-container`}
									style={childStyleStr}
									key={`trChild-${idxtr}`}
								>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'td') {
				// console.log('render01 td------')
				domHtml = (
					<View className={`${item.classStr || ''} wxParse-${item.tag}`}>
						{childNodes.map((child, idxtd) => {
							const childStyleStr = child.styleStr || {}
							return (
								<View
									className={`${child.classStr || ''} wxParse-${
										child.tag
									} wxParse-${child.tag}-container`}
									style={childStyleStr}
									key={`tdChild-${idxtd}`}
								>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'audio') {
				// console.log('render01 audio------')
				domHtml = (
					<View className='wxParse-audio'>
						<View
							className={`wxParse-audio-inner ${item.classStr || ''}`}
							style={`${item.styleStr || ''}`}
						>
							<CustomAudio
								src={item.attr.src}
								title={item.attr.title}
								desc={item.attr.desc}
							/>
						</View>
					</View>
				)
			} else if (item.tag === 'br') {
				// console.log('render01 br br------')
				domHtml = <Text>\n</Text>
			} else if (item.tag === 'hr') {
				// console.log('render01 hr hr hr---hr hr')
				domHtml = <View className='wxParse-hr' />
			} else if (item.tagType === 'block') {
				// console.log('item.tagType render01 block===', item)
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-${item.tag} mb10`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idxBlock) => {
							return (
								<Block key={`blockChild-${idxBlock}`}>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			} else {
				// console.log('render01 其他block item=========', item)
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-${item.tag} wxParse-${
							item.tagType
						}`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<Block key={`child-${idx}`}>
									{this.renderChildDom({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			}
		} else if (item.node === 'text') {
			// console.log('render01 text item--------------: ', item)
			domHtml = (
				<View
					className='WxEmojiView wxParse-inline'
					style={`${item.styleStr || ''}`}
				>
					{textArray.map((textItem: any, idx) => {
						return (
							<View key={`text-item-${idx}`}>
								{textItem.node === 'text' && textItem.text !== '\\n' ? (
									<Text selectable>{textItem.text}</Text>
								) : textItem.node === 'element' ? (
									<Image
										className='wxEmoji'
										src={`${textItem.baseSrc}${textItem.text}`}
									/>
								) : null}
							</View>
						)
					})}
				</View>
			)
		}
		return domHtml
	}

	/**
	 * 递归富文本html节点
	 */
	renderChildDom(props) {
		const {
			nodesData,
			wxparseRootKey,
			pageNodeKey,
			imageHeight,
			imageWidth
		} = props
		// console.log('render02 child props===: ', props)

		const item = nodesData
		const childNodes =
			Array.isArray(item.nodes) && item.nodes.length ? item.nodes : []
		const textArray =
			Array.isArray(item.textArray) && item.textArray.length
				? item.textArray
				: []
		let domHtml: any = null
		if (item.node === 'element') {
			// console.log('render02 child element')
			if (item.tag === 'button') {
				// console.log('render02 child button')
				domHtml = (
					<Button type='default' size='mini'>
						{childNodes.map((child, idx) => {
							return (
								<Block key={`wxParse-button-inner-${idx}`}>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</Button>
				)
			} else if (item.tag === 'ol') {
				// console.log('render02 child ol')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-ol mb10`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<View
									className='wxParse-ol-inner'
									key={`wxParse-ol-inner-${idx}`}
								>
									<View className='wxParse-ol-number'>{idx + 1}. </View>
									<View className='flex-full overflow-hide'>
										{this.renderRichText({
											nodesData: child,
											wxparseRootKey,
											pageNodeKey
										})}
									</View>
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'ul') {
				// console.log('render02 child ul')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-ul mb10`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<View
									className='wxParse-ul-inner'
									key={`wxParse-ul-inner-${idx}`}
								>
									<View className='wxParse-li-circle'></View>
									<View className='flex-full overflow-hide'>
										{this.renderRichText({
											nodesData: child,
											wxparseRootKey,
											pageNodeKey
										})}
									</View>
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'li') {
				// console.log('render02 child li')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-li`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<View key={`liChild-${idx}`}>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'video') {
				// console.log('render02 child video')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-${item.tag}`}
						style={`${item.styleStr || ''}`}
					>
						<Video
							className={`${item.classStr || ''} wxParse-${item.tag}-video`}
							src={item.attr.src}
						></Video>
					</View>
				)
			} else if (item.tag === 'img') {
				// console.log('render02 child img')
				// console.log('render02 child img ===', item)
				domHtml = (
					<View className='wxParse-img-inner'>
						<Image
							className={`${item.classStr || ''} wxParse-${
								item.tag
							} wxParse-img-fadein`}
							data-from={item.from}
							data-src={item.attr.src}
							data-idx={item.imgIndex}
							data-goodurl={item.attr.goodurl}
							lazyLoad
							src={item.attr.src}
							onClick={this.wxParseImgTap.bind(this)}
							mode='widthFix'
							onLoad={this.wxParseImgLoad.bind(this)}
							style={{
								width: `${item.attr.width || imageWidth}px`,
								height: `${item.attr.height || imageHeight}px`
							}}
						/>
					</View>
				)
			} else if (item.tag === 'a') {
				// console.log('render02 child aaaaaaa标签')
				domHtml = (
					<View
						className={`wxParse-inline ${item.classStr || ''} wxParse-${
							item.tag
						}`}
						data-title={item.attr.title}
						data-src={item.attr.href}
						style={`${item.styleStr || ''}`}
						onClick={this.wxParseTagATap.bind(this)}
					>
						{childNodes.map((child, idxA) => {
							return (
								<Block key={`aTagChild-${idxA}`}>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			} else if (item.tag === 'table') {
				// console.log('render02 child table')
				domHtml = (
					<View className={`${item.classStr || ''} wxParse-${item.tag}`}>
						{childNodes.map((child, idxTable) => {
							return (
								<Block key={`tableChild-${idxTable}`}>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			} else if (item.tag === 'tr') {
				// console.log('render02 child tr===')
				domHtml = (
					<View className={`${item.classStr || ''} wxParse-${item.tag}`}>
						{childNodes.map((child, idxtr) => {
							const childStyleStr = child.styleStr || {}
							return (
								<View
									className={`${child.classStr || ''} wxParse-${
										child.tag
									} wxParse-${child.tag}-container`}
									style={childStyleStr}
									key={`trChild-${idxtr}`}
								>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'td') {
				// console.log('render02 child td---')
				domHtml = (
					<View className={`${item.classStr || ''} wxParse-${item.tag}`}>
						{childNodes.map((child, idxtd) => {
							const childStyleStr = child.styleStr || {}
							return (
								<View
									className={`${child.classStr || ''} wxParse-${
										child.tag
									} wxParse-${child.tag}-container`}
									style={childStyleStr}
									key={`tdChild-${idxtd}`}
								>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</View>
							)
						})}
					</View>
				)
			} else if (item.tag === 'audio') {
				// console.log('render02 child audio---')
				domHtml = (
					<View className='wxParse-audio'>
						<View
							className={`wxParse-audio-inner ${item.classStr || ''}`}
							style={`${item.styleStr || ''}`}
						>
							<CustomAudio
								src={item.attr.src}
								title={item.attr.title}
								desc={item.attr.desc}
							/>
						</View>
					</View>
				)
			} else if (item.tag === 'br') {
				// console.log('render02 child br br br---')
				domHtml = <Text>\n</Text>
			} else if (item.tag === 'hr') {
				// console.log('render02 child hr hr hr---hr hr')
				domHtml = <View className='wxParse-hr' />
			} else if (item.tagType === 'block') {
				// console.log('item.tagType render02 block===', item)
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-${item.tag} mb10`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idxBlock) => {
							return (
								<Block key={`blockChild-${idxBlock}`}>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			} else {
				// console.log('render02 child else else else -----------')
				domHtml = (
					<View
						className={`${item.classStr || ''} wxParse-${item.tag} wxParse-${
							item.tagType
						}`}
						style={`${item.styleStr || ''}`}
					>
						{childNodes.map((child, idx) => {
							return (
								<Block key={`child-${idx}`}>
									{this.renderRichText({
										nodesData: child,
										wxparseRootKey,
										pageNodeKey
									})}
								</Block>
							)
						})}
					</View>
				)
			}
		} else if (item.node === 'text') {
			// console.log('render02 child text-------------')
			domHtml = (
				<View
					className='WxEmojiView wxParse-inline'
					style={`${item.styleStr || ''}`}
				>
					{textArray.map((textItem: any, idx) => {
						return (
							<View key={`text-item-${idx}`}>
								{textItem.node === 'text' && textItem.text !== '\\n' ? (
									<Text selectable>{textItem.text}</Text>
								) : textItem.node === 'element' ? (
									<Image
										className='wxEmoji'
										src={`${textItem.baseSrc}${textItem.text}`}
									/>
								) : null}
							</View>
						)
					})}
				</View>
			)
		}
		return domHtml
	}

	render() {
		const {
			nodesData,
			wxparseRootKey,
			pageNodeKey,
			imageHeight,
			imageWidth
		} = this.state
		console.log('nodesData render===', nodesData)
		const isNodes =
			Array.isArray(nodesData) && nodesData.length ? nodesData : false
		console.log('isNodes======', isNodes)
		return isNodes ? (
			<View className='mpParseHtml-comp'>
				{nodesData.map((item, index) => {
					return (
						<Block key={`parse-html-comp-${index}`}>
							{this.renderRichText({
								nodesData: item,
								wxparseRootKey,
								pageNodeKey,
								imageHeight,
								imageWidth
							})}
						</Block>
					)
				})}
			</View>
		) : null
	}
}

export default MpParseHtml

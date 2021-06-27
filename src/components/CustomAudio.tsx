/**
 * 小程序音频渲染组件
 */

import Taro, { Component } from "@tarojs/taro";
import { View, Image } from "@tarojs/components";

import "./CustomAudio.scss";

/**
 * props属性
 */
interface CAProps {
  title?: string
  desc?: string
  src: string
}

/**
 * 组件内部属性
 */
interface CAState {
  isPlay: boolean
  currentTimeStr: string
  durationStr: string
  progress: number
}

class CustomAudio extends Component<CAProps, CAState> {
  static defaultProps: CAProps = {
    title: "标题",
    desc: "小标题",
    src: ""
  };

  constructor(props) {
    super(props);
    this.state = {
      isPlay: false,
      currentTimeStr: "00:00",
      durationStr: "00:00",
      progress: 0
    };
  }

  componentWillMount() {
    if (this.props.src) {
      this.handleInitAudio(this.props.src);
    }
  }

  componentWillReceiveProps(nextProps) {
    // src监听
    if (
      this.props.src &&
      JSON.stringify(this.props.src) !== JSON.stringify(nextProps.src)
    ) {
      this.handleInitAudio(nextProps.src);
    }
  }

  innerAudioContext: any = null;

  /**
   * 初始化音频数据
   */
  handleInitAudio(src) {
    this.innerAudioContext = Taro.createInnerAudioContext();
    this.innerAudioContext.src = src;
    this.innerAudioContext.onPlay(() => {
      console.log("开始播放");
    });

    this.innerAudioContext.onCanplay(() => {
      // 这是一个迷，据说要手动先触发这个属性，后面才能用setTimeout获取真实时长
      this.innerAudioContext.duration;
      setTimeout(() => {
        const durationStr = this.parseTime(this.innerAudioContext.duration);
        this.setState({ durationStr });
      }, 1000);
    });

    this.innerAudioContext.onError((res: any) => {
      console.log(res.errMsg);
      console.log(res.errCode);
    });

    this.innerAudioContext.onEnded(() => {
      this.setState({ isPlay: false });
    });

    this.innerAudioContext.onTimeUpdate(() => {
      const currentTime = this.innerAudioContext.currentTime;
      const duration = this.innerAudioContext.duration;
      const currentTimeStr = this.parseTime(currentTime);
      const progress = (currentTime / duration) * 100;
      this.setState({ currentTimeStr, progress });
    });
  }

  /**
   * 控制播放
   */
  handleControl() {
    if (!this.state.isPlay) {
      this.setState({ isPlay: true });
      this.innerAudioContext.play();
    } else {
      this.setState({ isPlay: false });
      this.innerAudioContext.pause();
    }
  }

  parseTime(time) {
    const minute = Math.floor(time / 60);
    const second = Math.floor(time % 60);
    return `${minute < 10 ? "0" + minute : minute}:${
      second < 10 ? "0" + second : second
    }`;
  }

  render() {
    const { isPlay, currentTimeStr, durationStr, progress } = this.state;
    const { src, title, desc } = this.props;
    return src ? (
      <View className='custom-audio-comp'>
        <View className='custom-audio' onClick={this.handleControl.bind(this)}>
          <View className='custom-audio-left'>
            <Image
              hidden={isPlay}
              src={require("~/assets/images/audio/pause.png")}
              className='custom-audio-icon'
            />
            <Image
              hidden={!isPlay}
              src={require("~/assets/images/audio/playing.gif")}
              className='custom-audio-icon'
            />
          </View>

          <View className='custom-audio-right'>
            <View className='custom-audio-title'>{title}</View>
            <View className='custom-audio-author'>{desc}</View>
            <View className='custom-audio-progress'>
              <View
                className='custom-audio-current'
                style={{ width: `${progress}%` }}
              ></View>
            </View>
            <View className='custom-audio-time'>
              <text className='custom-audio-begin'>{currentTimeStr}</text>
              <text className='custom-audio-total'>{durationStr}</text>
            </View>
          </View>
        </View>
      </View>
    ) : null;
  }
}

export default CustomAudio;

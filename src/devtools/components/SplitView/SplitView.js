import React from 'react';
import './SplitView.css';

// Neither pane can be dragged narrower than this, in pixels
const MIN_PANE_WIDTH = 100;

/*
 * Two panes side by side, with a divider between them that can be dragged to
 * resize them. The left pane's width (a percentage) is kept here rather than
 * in App, so dragging doesn't re-render the panes themselves.
 */
class SplitView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      leftWidth: props.leftWidth,
      isDragging: false
    };
    this.startDrag = this.startDrag.bind(this);
    this.drag = this.drag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.leftWidth !== this.state.leftWidth) {
      // Ace editors only re-measure themselves when the window resizes
      window.dispatchEvent(new Event('resize'));
    }
  }

  startDrag(event) {
    if(event.button !== 0) return;
    // Keep getting pointer events when the pointer moves off the divider
    event.target.setPointerCapture(event.pointerId);
    // Don't start a text selection
    event.preventDefault();
    this.setState(() => ({ isDragging: true }));
  }

  drag(event) {
    if(!this.state.isDragging) return;
    const { left, width } = this.container.getBoundingClientRect();
    const leftPixels = Math.min(Math.max(event.clientX - left, MIN_PANE_WIDTH), width - MIN_PANE_WIDTH);
    this.setState(() => ({ leftWidth: leftPixels / width * 100 }));
  }

  stopDrag() {
    if(!this.state.isDragging) return;
    this.setState(() => ({ isDragging: false }));
    this.props.onResizeEnd(this.state.leftWidth);
  }

  render() {
    const { left, right, leftClassName, rightClassName } = this.props;
    const { leftWidth, isDragging } = this.state;
    const draggingClass = isDragging ? 'dragging' : '';
    return (
      <div className={`SplitView ${draggingClass}`} ref={(container) => { this.container = container; }}>
        <div className={`SplitView__pane ${leftClassName}`} style={{ width: `${leftWidth}%` }}>
          {left}
          <div
            className="SplitView__divider"
            role="separator"
            onPointerDown={this.startDrag}
            onPointerMove={this.drag}
            onPointerUp={this.stopDrag}
            onLostPointerCapture={this.stopDrag}
          />
        </div>
        <div className={`SplitView__pane ${rightClassName}`} style={{ width: `${100 - leftWidth}%` }}>
          {right}
        </div>
      </div>
    );
  }

}

export default SplitView;

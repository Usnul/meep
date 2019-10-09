import DataType from "../../../parser/simple/DataType.js";

/**
 *
 * @param {ReactiveExpression} node
 * @param {DataType} type
 */
function setNodeType(node, type) {
    if (node.dataType === DataType.Any) {
        node.dataType = type;
    } else if (node.dataType !== type) {
        //wrong type
        console.warn(`Expected member or logic expression to have type '${type}', instead was '${node.dataType}'`, node);
    }
}

/**
 * Infer types in an expression tree, input tree is mutated as a result
 * @param {ReactiveExpression} exp
 */
export function inferReactiveExpressionTypes(exp) {
    exp.traverse(function (v) {
        if (v.isBinaryExpression) {
            if (v.left !== null && v.right !== null) {
                if (v.isLogicExpression) {
                    setNodeType(v.left, DataType.Boolean);
                    setNodeType(v.right, DataType.Boolean);
                } else if (v.isComparativeExpression) {
                    if (v.isReactiveEquals) {
                        if (v.left.dataType !== DataType.Any) {
                            setNodeType(v.right, v.left.dataType);
                        } else if (v.right.dataType !== DataType.Any) {
                            setNodeType(v.left, v.right.dataType);
                        }
                    } else {
                        setNodeType(v.left, DataType.Number);
                        setNodeType(v.right, DataType.Number);
                    }
                } else if (v.isArithmeticExpression) {
                    setNodeType(v.left, DataType.Number);
                    setNodeType(v.right, DataType.Number);
                }
            }
        } else if (v.isUnaryExpression) {
            if (v.source !== null) {
                if (v.isLogicExpression) {
                    setNodeType(v.source, DataType.Boolean);
                } else if (v.isArithmeticExpression) {
                    setNodeType(v.source, DataType.Number);
                }
            }
        }
    });
}

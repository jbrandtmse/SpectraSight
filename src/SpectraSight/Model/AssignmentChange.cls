Class SpectraSight.Model.AssignmentChange Extends SpectraSight.Model.Activity
{

Property FromAssignee As %String(%JSONFIELDNAME = "fromAssignee");

Property ToAssignee As %String(%JSONFIELDNAME = "toAssignee");

Storage Default
{
<Data name="AssignmentChangeDefaultData">
<Subscript>"AssignmentChange"</Subscript>
<Value name="1">
<Value>FromAssignee</Value>
</Value>
<Value name="2">
<Value>ToAssignee</Value>
</Value>
</Data>
<DefaultData>AssignmentChangeDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}

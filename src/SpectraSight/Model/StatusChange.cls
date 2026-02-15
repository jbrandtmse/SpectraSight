Class SpectraSight.Model.StatusChange Extends SpectraSight.Model.Activity
{

Property FromStatus As %String(%JSONFIELDNAME = "fromStatus");

Property ToStatus As %String(%JSONFIELDNAME = "toStatus");

Storage Default
{
<Data name="StatusChangeDefaultData">
<Subscript>"StatusChange"</Subscript>
<Value name="1">
<Value>FromStatus</Value>
</Value>
<Value name="2">
<Value>ToStatus</Value>
</Value>
</Data>
<DefaultData>StatusChangeDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
